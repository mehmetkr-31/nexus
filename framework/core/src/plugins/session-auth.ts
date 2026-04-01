import type { SessionManager } from "../auth/session-manager.js";
import type { NexusServerPlugin } from "../types/client.js";

export interface SessionAuthPluginOptions {
	sessionManager: SessionManager;
}

/**
 * Ensures that the developer is alerted if they try to perform operations
 * without a valid session context being extracted.
 * Usually works in tandem with the createNexusContextExtractor helper.
 */
export function sessionAuthPlugin(
	_options: SessionAuthPluginOptions,
): NexusServerPlugin<Record<string, unknown>> {
	return {
		id: "session-auth",

		extendOperations: (baseOps, ctx) => {
			// This plugin acts as an interceptor. If you try to run an operation
			// without a token or partyId, it forcefully throws an Auth error.

			const requireAuth = () => {
				if (!ctx.partyId || !ctx.token) {
					throw new Error("NexusAuthError: Unauthorized. Missing partyId or token in context.");
				}
			};

			return {
				...baseOps,

				create: async (payload: unknown) => {
					requireAuth();
					return baseOps.create(payload);
				},

				findMany: async (options?: Record<string, unknown>) => {
					requireAuth();
					return baseOps.findMany(options);
				},

				findById: async (contractId: string) => {
					requireAuth();
					return baseOps.findById(contractId);
				},

				exercise: async (contractId: string, choiceName: string, choiceArgument: unknown) => {
					requireAuth();
					return baseOps.exercise(contractId, choiceName, choiceArgument);
				},

				archive: async (contractId: string) => {
					requireAuth();
					return baseOps.archive(contractId);
				},
			};
		},
	};
}
