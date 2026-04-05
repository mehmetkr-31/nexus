import { Kysely, PostgresDialect, sql } from "kysely";
import pkg from "pg";

const { Pool } = pkg;

import type { PqsFindOptions } from "../types/client.js";

/**
 * Canton PQS (Participant Query Store) table schema.
 * PQS writes all active contracts into a single `active_contracts` table.
 *
 * @see https://docs.digitalasset.com/build/3.4/sdlc-howtos/canton/participant-query-store
 */
interface ActiveContractsTable {
	contract_id: string;
	template_id_package_id: string;
	template_id_module_name: string;
	template_id_entity_name: string;
	/** Daml contract payload stored as JSONB */
	create_argument: Record<string, unknown>;
	signatories: string[];
	observers: string[];
	created_at: string;
}

interface PqsDatabase {
	active_contracts: ActiveContractsTable;
}

/**
 * PQS Database (PostgreSQL) engine using Kysely.
 *
 * Queries the Canton PQS `active_contracts` table — the canonical table that
 * Canton's Participant Query Store maintains. All contract types live in this
 * single table, filtered by `template_id_*` columns.
 *
 * Row Level Security (RLS) is enforced by setting `app.current_user` before
 * every query inside a transaction, matching the Canton PQS RLS policy convention.
 */
export class KyselyPqsEngine {
	private readonly db: Kysely<PqsDatabase>;

	constructor(pqsUrl: string) {
		this.db = new Kysely<PqsDatabase>({
			dialect: new PostgresDialect({
				pool: new Pool({
					connectionString: pqsUrl,
					max: 10,
				}),
			}),
		});
	}

	/**
	 * Scopes queries inside a transaction with a session variable for RLS.
	 */
	private async withRls<T>(
		partyId: string,
		callback: (trx: Kysely<PqsDatabase>) => Promise<T>,
	): Promise<T> {
		return this.db.transaction().execute(async (trx) => {
			await sql`SET LOCAL app.current_user = ${partyId}`.execute(trx);
			return callback(trx);
		});
	}

	/**
	 * Parse a Canton template ID string into its components.
	 * Accepts both "pkgId:Module:Entity" and TemplateDescriptor-style formats.
	 */
	private parseTemplateId(templateId: string): {
		packageId: string;
		moduleName: string;
		entityName: string;
	} {
		const parts = templateId.split(":");
		if (parts.length !== 3 || parts.some((p) => !p)) {
			throw new Error(
				`KyselyPqsEngine: invalid templateId "${templateId}". ` +
					`Expected "packageId:ModuleName:EntityName".`,
			);
		}
		return {
			packageId: parts[0] as string,
			moduleName: parts[1] as string,
			entityName: parts[2] as string,
		};
	}

	/**
	 * Find many contracts in the PQS `active_contracts` table.
	 *
	 * @param partyId  Authenticated party — used for RLS enforcement
	 * @param templateId  Canton template ID string "pkgId:Module:Entity"
	 * @param options  Filter, limit, orderBy constraints
	 */
	public async findMany(
		partyId: string,
		templateId: string,
		options?: PqsFindOptions<unknown>,
	): Promise<{ contractId: string; payload: unknown }[]> {
		const { packageId, moduleName, entityName } = this.parseTemplateId(templateId);

		return this.withRls(partyId, async (trx) => {
			let query = trx
				.selectFrom("active_contracts")
				.selectAll()
				.where("template_id_package_id", "=", packageId)
				.where("template_id_module_name", "=", moduleName)
				.where("template_id_entity_name", "=", entityName);

			if (options?.where) {
				query = applyWhere(query, options.where as Record<string, unknown>);
			}

			if (options?.limit) {
				query = query.limit(options.limit);
			}

			if (options?.orderBy) {
				for (const [key, direction] of Object.entries(options.orderBy)) {
					// biome-ignore lint/suspicious/noExplicitAny: dynamic column names from user options
					query = (query as any).orderBy(key, direction as "asc" | "desc");
				}
			}

			const rows = await query.execute();

			return rows.map((r) => ({
				contractId: r.contract_id,
				payload: r.create_argument,
			}));
		});
	}

	/**
	 * Fetch a single contract from `active_contracts` by its contract ID.
	 * Returns `null` if not found or archived.
	 */
	public async findById(
		partyId: string,
		_templateId: string,
		contractId: string,
	): Promise<{ contractId: string; payload: unknown } | null> {
		return this.withRls(partyId, async (trx) => {
			const row = await trx
				.selectFrom("active_contracts")
				.selectAll()
				.where("contract_id", "=", contractId)
				.executeTakeFirst();

			if (!row) return null;
			return {
				contractId: row.contract_id,
				payload: row.create_argument,
			};
		});
	}

	public destroy() {
		return this.db.destroy();
	}
}

// ─── Where clause builder ─────────────────────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: Kysely query builders require any for recursive chaining
function applyWhere(query: any, whereObj: Record<string, unknown>): any {
	for (const [key, val] of Object.entries(whereObj)) {
		if (key === "AND" && Array.isArray(val)) {
			// biome-ignore lint/suspicious/noExplicitAny: Recursive ExpressionBuilder
			query = query.where((eb: any) =>
				eb.and(val.map((condition: Record<string, unknown>) => applyWhere(eb, condition))),
			);
		} else if (key === "OR" && Array.isArray(val)) {
			// biome-ignore lint/suspicious/noExplicitAny: Recursive ExpressionBuilder
			query = query.where((eb: any) =>
				eb.or(val.map((condition: Record<string, unknown>) => applyWhere(eb, condition))),
			);
		} else if (typeof val === "object" && val !== null) {
			const typedVal = val as Record<string, unknown>;
			if ("gt" in typedVal) query = query.where(key, ">", typedVal.gt);
			if ("gte" in typedVal) query = query.where(key, ">=", typedVal.gte);
			if ("lt" in typedVal) query = query.where(key, "<", typedVal.lt);
			if ("lte" in typedVal) query = query.where(key, "<=", typedVal.lte);
		} else {
			query = query.where(key, "=", val);
		}
	}
	return query;
}
