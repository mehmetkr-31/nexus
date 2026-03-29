import { PartyIdResolver } from "./auth/party-id-resolver.ts";
import { SessionManager } from "./auth/session-manager.ts";
import { CantonClient } from "./client/canton-client.ts";
import { CommandSubmitter } from "./ledger/command-submitter.ts";
import { ContractQuery } from "./ledger/contract-query.ts";
import { InterfaceQuery } from "./ledger/interface-query.ts";
import { LedgerIdentity } from "./ledger/ledger-identity.ts";
import { PackageResolver } from "./ledger/package-resolver.ts";
import type { NexusClient } from "./types/index.ts";
import type { FetchMiddleware, NexusPlugin } from "./types/plugin.ts";

export { PartyIdResolver } from "./auth/party-id-resolver.ts";
export { type JwtAuthOptions, jwtAuth } from "./auth/plugins/jwt-auth.ts";
export { type OidcAuthOptions, oidcAuth } from "./auth/plugins/oidc-auth.ts";
export {
	type SandboxAuthOptions,
	sandboxAuth,
} from "./auth/plugins/sandbox-auth.ts";
export { generateEncryptionKey, SessionManager } from "./auth/session-manager.ts";

export { CantonClient } from "./client/canton-client.ts";
export { CommandSubmitter } from "./ledger/command-submitter.ts";
export { ContractQuery } from "./ledger/contract-query.ts";
export { InterfaceQuery } from "./ledger/interface-query.ts";
export { LedgerIdentity } from "./ledger/ledger-identity.ts";
export { packageDiscoveryPlugin } from "./ledger/package-discovery-plugin.ts";
export { PackageResolver } from "./ledger/package-resolver.ts";
export { provisionSandboxUser } from "./ledger/sandbox-provision.ts";
export { fetchMiddlewarePlugin } from "./plugins/fetch-middleware-plugin.ts";
export * from "./types/index.ts";
export type {
	FetchMiddleware,
	InferNexusPlugins,
	InferPluginContext,
	NexusPlugin,
	RequestConfig,
} from "./types/plugin.ts";

import type { InferNexusPlugins } from "./types/plugin.ts";

/**
 * Initialize a Nexus client with the given configuration and plugins.
 */
export async function createNexus<
	TPlugins extends NexusPlugin<Record<string, unknown>>[],
>(options: {
	ledgerApiUrl: string;
	timeoutMs?: number;
	plugins: TPlugins;
}): Promise<NexusClient & InferNexusPlugins<TPlugins>> {
	const authPlugin = options.plugins.find((p) => p.auth);
	if (!authPlugin?.auth) {
		throw new Error(
			"createNexus: at least one plugin must provide authentication. " +
				"Use sandboxAuth(), jwtAuth(), or oidcAuth().",
		);
	}

	const getToken = () =>
		authPlugin.auth?.getToken() ?? Promise.reject(new Error("No auth plugin provided"));

	// Collect middleware from all plugins
	const middlewares: FetchMiddleware[] = options.plugins
		.filter((p): p is NexusPlugin & { middleware: FetchMiddleware } => p.middleware != null)
		.map((p) => p.middleware);

	const http = new CantonClient({
		baseUrl: options.ledgerApiUrl,
		getToken,
		timeoutMs: options.timeoutMs,
		middlewares,
	});

	const client: NexusClient = {
		config: {
			ledgerApiUrl: options.ledgerApiUrl,
			timeoutMs: options.timeoutMs,
		},
		packages: new PackageResolver(http),
		http,
		auth: {
			partyId: new PartyIdResolver(http),
			session: new SessionManager({}),
		},
		ledger: {
			contracts: new ContractQuery(http),
			interfaces: new InterfaceQuery(http),
			commands: new CommandSubmitter(http),
			identity: new LedgerIdentity(http),
		},
		getToken,
	};

	const dispatchRefresh = (newToken: string) => {
		for (const p of options.plugins) {
			p.onTokenRefreshed?.(newToken);
		}
	};

	for (const plugin of options.plugins) {
		if (plugin.id.endsWith("-auth") && plugin.setRefreshDispatcher) {
			plugin.setRefreshDispatcher(dispatchRefresh);
		}
	}

	const context: Record<string, unknown> = {};
	for (const plugin of options.plugins) {
		if (plugin.init) {
			Object.assign(context, await plugin.init(client));
		}
	}

	return {
		...client,
		...context,
	} as NexusClient & InferNexusPlugins<TPlugins>;
}
