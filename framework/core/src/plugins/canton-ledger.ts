import { CantonClient } from "../client/canton-client.js";
import { toStableTemplateId } from "../utils/template.js";
import type { NexusServerPlugin } from "../types/client.js";

export interface CantonLedgerPluginOptions {
	/** Canton JSON Ledger API base URL (e.g., http://localhost:7575) */
	url: string;
	timeoutMs?: number;
}

/**
 * Server plugin: provides Ledger write operations (create, exercise, archive)
 * via the Canton HTTP JSON Ledger API v2.
 *
 * Uses `CantonClient` for proper auth, Zod validation, retry logic, and
 * deduplication — not the deprecated `CantonJsonApiClient`.
 *
 * The `token` from context is passed as a static token factory so each
 * per-request `withUser(partyId, token)` call gets a fresh `CantonClient`
 * bound to that user's JWT.
 */
export function cantonLedgerPlugin(
	options: CantonLedgerPluginOptions,
): NexusServerPlugin<Record<string, unknown>> {
	return {
		id: "canton-ledger",

		extendOperations: (baseOps, ctx) => {
			// Build a per-request CantonClient that uses this user's token.
			// The client is lightweight — no connection pooling needed for HTTP.
			const client = new CantonClient({
				baseUrl: options.url,
				timeoutMs: options.timeoutMs,
				getToken: async () => {
					if (!ctx.token) {
						throw new Error(
							"cantonLedgerPlugin: no token in context. Ensure sessionAuthPlugin runs first.",
						);
					}
					return ctx.token;
				},
			});

			const templateId = toStableTemplateId(ctx.templateId);
			const actAs = [ctx.partyId];

			return {
				...baseOps,

				create: async (payload: unknown) => {
					// Validate + encode via the Daml codegen template
					const result = ctx.template.decoder.run(payload) as {
						ok: boolean;
						result?: unknown;
						error?: { message: string };
					};
					if (!result.ok || result.result === undefined) {
						throw new Error(
							`Daml schema validation failed for ${ctx.templateId}: ` +
								(result.error?.message ?? "unknown error"),
						);
					}
					const encoded = ctx.template.encode(result.result);

					const submitResult = await client.submitAndWait({
						commands: [{ type: "create", templateId, createArguments: encoded }],
						actAs,
					});

					return {
						contractId: submitResult.updateId, // updateId from submit-and-wait
						payload: encoded as Record<string, unknown>,
					};
				},

				exercise: async (contractId: string, choiceName: string, choiceArgument: unknown) => {
					return client.submitAndWait({
						commands: [
							{
								type: "exercise",
								templateId,
								contractId,
								choice: choiceName,
								choiceArgument,
							},
						],
						actAs,
					});
				},

				archive: async (contractId: string) => {
					return client.submitAndWait({
						commands: [
							{
								type: "exercise",
								templateId,
								contractId,
								choice: "Archive",
								choiceArgument: {},
							},
						],
						actAs,
					});
				},
			};
		},
	};
}
