import { Kysely, PostgresDialect } from "kysely";
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
	 * Takes a generic options object (similar to modern ORM find parameters),
	 * building Kysely query chains for extremely fast payload retrieval.
	 *
	 * @param templateIdRaw The raw Daml generated format of the Template ID
	 * @param options Query and filter constraints
	 * @returns Array of resulting database rows
	 */
	public async findMany(
		templateIdRaw: string,
		options?: PqsFindOptions<unknown>,
	): Promise<unknown[]> {
		// PQS usually translates table names by replacing special formatting with underscores.
		const tableName = sanitizePqsTableName(templateIdRaw);

		let query = this.db.selectFrom(tableName).selectAll();

		if (options?.where) {
			for (const [key, val] of Object.entries(options.where)) {
				if (typeof val === "object" && val !== null) {
					const typedVal = val as unknown as Record<string, unknown>;
					// Handle comparative operators
					if ("gt" in typedVal) query = query.where(key, ">", typedVal.gt);
					if ("gte" in typedVal) query = query.where(key, ">=", typedVal.gte);
					if ("lt" in typedVal) query = query.where(key, "<", typedVal.lt);
					if ("lte" in typedVal) query = query.where(key, "<=", typedVal.lte);
				} else {
					// Handle strict equality constraints
					query = query.where(key, "=", val);
				}
			}
		}

		if (options?.limit) {
			query = query.limit(options.limit as number);
		}

		if (options?.orderBy) {
			for (const [key, direction] of Object.entries(options.orderBy)) {
				query = query.orderBy(key, direction as "asc" | "desc");
			}
		}

		// Execute compiled SQL directly against the Canton PQS replica
		const rows = await query.execute();
		return rows as unknown[];
	}

	public destroy() {
		return this.db.destroy();
	}
}

/**
 * Safely sanitizes default Canton Participant Query Store table names.
 */
function sanitizePqsTableName(templateId: string): string {
	// E.g., translates "98cc1...:NexusApp:Iou" into "nexusapp_iou"
	return templateId.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}
