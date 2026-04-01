import { Kysely, PostgresDialect, sql } from "kysely";
import pkg from "pg";

const { Pool } = pkg;

import type { PqsFindOptions } from "../types/client.js";

type GenericKyselyDb = Record<string, Record<string, unknown>>;

/**
 * PQS Database (PostgreSQL) engine utilizing Kysely and Postgres (pg).
 * Designed as an ultra-lightweight dynamic SQL builder.
 */
export class KyselyPqsEngine {
	private readonly db: Kysely<GenericKyselyDb>;

	constructor(pqsUrl: string) {
		this.db = new Kysely<GenericKyselyDb>({
			dialect: new PostgresDialect({
				pool: new Pool({
					connectionString: pqsUrl,
					max: 10, // Default pool size suitable for typical deployments
				}),
			}),
		});
	}

	/**
	 * Scopes database queries within a transaction with an isolated session variable
	 * for Row Level Security (RLS) enforcement.
	 */
	private async withRls<T>(
		partyId: string,
		callback: (trx: Kysely<GenericKyselyDb>) => Promise<T>,
	): Promise<T> {
		return this.db.transaction().execute(async (trx) => {
			// Ensure sub-transaction privacy by setting session variable for RLS
			await sql`SET LOCAL app.current_user = ${partyId}`.execute(trx);
			return callback(trx);
		});
	}

	/**
	 * Takes a generic options object (similar to modern ORM find parameters),
	 * building Kysely query chains for extremely fast payload retrieval.
	 *
	 * @param partyId The authenticated participant requesting data
	 * @param templateIdRaw The raw Daml generated format of the Template ID
	 * @param options Query and filter constraints
	 * @returns Array of resulting database rows (payloads)
	 */
	public async findMany(
		partyId: string,
		templateIdRaw: string,
		options?: PqsFindOptions<unknown>,
	): Promise<unknown[]> {
		return this.withRls(partyId, async (trx) => {
			const tableName = sanitizePqsTableName(templateIdRaw);
			let query = trx.selectFrom(tableName).selectAll();

			if (options?.where) {
				query = applyWhere(query, options.where);
			}

			if (options?.limit) {
				query = query.limit(options.limit as number);
			}

			if (options?.orderBy) {
				for (const [key, direction] of Object.entries(options.orderBy)) {
					query = query.orderBy(key, direction as "asc" | "desc");
				}
			}

			const rows = await query.execute();

			// PQS tables typically wrap the real data inside a 'payload' column or field
			return rows.map((r: unknown) => {
				const rec = r as Record<string, unknown>;
				// We package the raw payload back with its contractId as expected by the SDK Contract type.
				return {
					contractId: rec.contract_id ?? "",
					payload: rec.payload ?? rec,
				};
			});
		});
	}

	/**
	 * Fetches a single contract by its Ledger assigned ID.
	 */
	public async findById(
		partyId: string,
		templateIdRaw: string,
		contractId: string,
	): Promise<unknown | null> {
		return this.withRls(partyId, async (trx) => {
			const tableName = sanitizePqsTableName(templateIdRaw);
			const row = await trx
				.selectFrom(tableName)
				.selectAll()
				.where("contract_id", "=", contractId)
				.executeTakeFirst();

			if (!row) return null;
			const rec = row as Record<string, unknown>;
			return {
				contractId: rec.contract_id ?? "",
				payload: rec.payload ?? rec,
			};
		});
	}

	public destroy() {
		return this.db.destroy();
	}
}

/**
 * Recursively applies OR/AND/Equal filters.
 */
// biome-ignore lint/suspicious/noExplicitAny: Recursive Kysely query builders are extremely hard to type explicitly
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

/**
 * Safely sanitizes default Canton Participant Query Store table names.
 */
function sanitizePqsTableName(templateId: string): string {
	// E.g., translates "98cc1...:NexusApp:Iou" into "nexusapp_iou"
	return templateId.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}
