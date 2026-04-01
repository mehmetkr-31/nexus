import { KyselyPqsEngine } from "../query/pqs-engine.js";
import type { Contract, NexusServerPlugin, PqsFindOptions, Prettify } from "../types/client.js";

export interface PqsDatabasePluginOptions {
	/** Target Postgres connection string (e.g., postgres://user:pass@localhost:5432) */
	url: string;
}

/**
 * Provides database query operations (findMany, findById)
 * via Kysely connected directly to the Canton PQS replica.
 */
export function pqsDatabasePlugin(
	options: PqsDatabasePluginOptions,
): NexusServerPlugin<Record<string, unknown>> {
	let pqsEngine: KyselyPqsEngine;

	return {
		id: "pqs-database",

		onInit: () => {
			pqsEngine = new KyselyPqsEngine(options.url);
		},

		extendOperations: (baseOps, ctx) => {
			return {
				...baseOps,

				findMany: async (options?: PqsFindOptions<unknown>) => {
					if (!pqsEngine) throw new Error("PqsDatabasePlugin not initialized");
					const results = await pqsEngine.findMany(ctx.partyId, ctx.templateId, options);
					return results as Prettify<Contract<unknown>>[];
				},

				findById: async (contractId: string) => {
					if (!pqsEngine) throw new Error("PqsDatabasePlugin not initialized");
					const result = await pqsEngine.findById(ctx.partyId, ctx.templateId, contractId);
					return result as Prettify<Contract<unknown>> | null;
				},
			};
		},
	};
}
