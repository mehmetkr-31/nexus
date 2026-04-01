// /framework/core/src/server.ts

import type { SessionManager } from "./auth/session-manager.js";
import type {
	CommandQueryOperations,
	ConstructNexusApi,
	DamlTemplate,
	NexusServerConfig,
	NexusUniversalClient,
} from "./types/client.js";

export * from "./command/ledger-fetch.js";
// Export the newly created plugins
export * from "./plugins/canton-ledger.js";
export * from "./plugins/pqs-database.js";
export * from "./plugins/session-auth.js";
export * from "./query/pqs-engine.js";
export * from "./types/client.js";

/**
 * Creates the Isomorphic Universal Nexus SDK Server Client.
 * Highly modular, supporting custom plugins for Auth, Database (PQS), and Ledger.
 *
 * @param config Nexus Server Configuration including plugins, types, and URLs.
 * @returns The typed Nexus Universal API exposing the withUser context
 */
export function createNexusServerClient<T extends Record<string, unknown>>(
	config: NexusServerConfig<T>,
): NexusUniversalClient<T> {
	// Initialize plugins
	const plugins = config.plugins ?? [];
	for (const plugin of plugins) {
		if (plugin.onInit) {
			plugin.onInit(config);
		}
	}

	return {
		withUser: (partyId: string, token?: string) => {
			const proxyClient = new Proxy(
				{},
				{
					get(_target, contractKey: string) {
						if (contractKey === "then" || contractKey === "catch") return undefined;

						const damlTemplate = config.types[contractKey] as DamlTemplate<unknown> | undefined;

						if (!damlTemplate?.templateId) {
							throw new Error(
								`Nexus Client Error: Contract '${contractKey}' was not found across the provided Typegen objects.`,
							);
						}

						// Base dummy operations. In a fully modular setup, the plugins must provide the implementation.
						let baseOperations: CommandQueryOperations<unknown> = {
							create: async () => {
								throw new Error("No Ledger plugin configured");
							},
							findMany: async () => {
								throw new Error("No PQS plugin configured");
							},
							findById: async () => {
								throw new Error("No PQS plugin configured");
							},
							exercise: async () => {
								throw new Error("No Ledger plugin configured");
							},
							archive: async () => {
								throw new Error("No Ledger plugin configured");
							},
						};

						// Allow plugins to intercept and modify operations
						for (const plugin of plugins) {
							if (plugin.extendOperations) {
								baseOperations = plugin.extendOperations(baseOperations, {
									partyId,
									token,
									templateId: damlTemplate.templateId,
									template: damlTemplate,
								});
							}
						}

						return baseOperations;
					},
				},
			);
			return proxyClient as unknown as ConstructNexusApi<T>;
		},
	};
}

/**
 * Creates a higher-order abstraction that automatically extracts the
 * user's session from the standard Web API `Request` object and returns
 * a fully authenticated SDK context.
 *
 * @param serverClient The base server client instance created by createNexusServerClient
 * @param sessionManager The configured Nexus Session Manager instance
 * @returns An async function that takes a Request and returns the fully typed UserContext API
 */
export function createNexusContextExtractor<T extends Record<string, unknown>>(
	serverClient: NexusUniversalClient<T>,
	sessionManager: SessionManager,
): (req: Request) => Promise<ConstructNexusApi<T>> {
	return async (req: Request): Promise<ConstructNexusApi<T>> => {
		const session = await sessionManager.requireSession(req);
		return serverClient.withUser(session.partyId, session.token);
	};
}
