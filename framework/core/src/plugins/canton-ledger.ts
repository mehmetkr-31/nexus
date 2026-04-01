import { CantonJsonApiClient } from "../command/ledger-fetch.js";
import type { NexusServerPlugin } from "../types/client.js";

export interface CantonLedgerPluginOptions {
	/** Target HTTP JSON API (e.g., http://localhost:7575) */
	url: string;
}

/**
 * Provides Ledger write operations (create, exercise, archive)
 * via the Canton HTTP JSON V2 API.
 */
export function cantonLedgerPlugin(
	options: CantonLedgerPluginOptions,
): NexusServerPlugin<Record<string, unknown>> {
	let ledgerClient: CantonJsonApiClient;

	return {
		id: "canton-ledger",

		onInit: () => {
			ledgerClient = new CantonJsonApiClient(options.url);
		},

		extendOperations: (baseOps, ctx) => {
			return {
				...baseOps,

				create: async (payload: unknown) => {
					if (!ledgerClient) throw new Error("CantonLedgerPlugin not initialized");

					const result = ctx.template.decoder.run(payload) as {
						ok: boolean;
						result?: unknown;
						error?: { message: string };
					};

					if (!result.ok || result.result === undefined) {
						throw new Error(
							`Daml Schema Validation Error (${ctx.templateId}): ${result.error?.message ?? "Unknown validation failure"}`,
						);
					}

					const encodedArg = ctx.template.encode(result.result);
					return ledgerClient.create(ctx.token, ctx.templateId, encodedArg) as Promise<{
						contractId: string;
						payload: Record<string, unknown>;
					}>;
				},

				exercise: async (contractId: string, choiceName: string, choiceArgument: unknown) => {
					if (!ledgerClient) throw new Error("CantonLedgerPlugin not initialized");
					return ledgerClient.exercise(
						ctx.token,
						ctx.templateId,
						contractId,
						choiceName,
						choiceArgument,
					);
				},

				archive: async (contractId: string) => {
					if (!ledgerClient) throw new Error("CantonLedgerPlugin not initialized");
					return ledgerClient.exercise(ctx.token, ctx.templateId, contractId, "Archive", {});
				},
			};
		},
	};
}
