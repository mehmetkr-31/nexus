import { PartyIdResolver } from "./auth/party-id-resolver.ts";
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
export { DEFAULT_PAGE_SIZE, DEFAULT_TIMEOUT_MS, DEFAULT_WS_PING_INTERVAL_MS } from "./config.ts";

export { CantonClient } from "./client/canton-client.ts";
export { CommandSubmitter } from "./ledger/command-submitter.ts";
export { ContractQuery } from "./ledger/contract-query.ts";
export { InterfaceQuery } from "./ledger/interface-query.ts";
export { LedgerIdentity } from "./ledger/ledger-identity.ts";
export { packageDiscoveryPlugin } from "./ledger/package-discovery-plugin.ts";
export { PackageResolver } from "./ledger/package-resolver.ts";
export { provisionSandboxUser } from "./ledger/sandbox-provision.ts";
export { fetchMiddlewarePlugin } from "./plugins/fetch-middleware-plugin.ts";
export type {
	ActiveContract,
	ActiveContractsResponse,
	ActiveInterface,
	ActiveInterfacesResponse,
	ArchivedEvent,
	Command,
	CompletionEvent,
	ContractQueryFilters,
	CreateCommand,
	DamlChoice,
	DamlTemplate,
	DamlTemplateIdentity,
	DeduplicationPeriod,
	ExerciseCommand,
	ExercisedEvent,
	ExerciseResult,
	LedgerEnd,
	NexusSession,
	NexusTemplateIdentifier,
	PackageId,
	StreamHandle,
	SubmitResult,
	SynchronizerInfo,
	TemplateDescriptor,
	TemplateId,
	TransactionEvent,
	TransactionResult,
	TransactionStatus,
} from "./types/index.ts";
export {
	NexusAuthError,
	NexusError,
	NexusLedgerError,
} from "./types/index.ts";

export type {
	FetchMiddleware,
	InferNexusClientPlugins,
	InferPluginContext,
	NexusClient,
	NexusConfig,
	NexusPlugin,
	RequestConfig,
} from "./types/plugin.ts";

export * from "./utils/jwt.ts";
export * from "./utils/canton-jwt.ts";
export * from "./utils/template.ts";

import type { InferNexusClientPlugins } from "./types/plugin.ts";

/**
 * Initialize a Nexus client with the given configuration and plugins.
 */
export async function createNexus<
	TPlugins extends NexusPlugin<Record<string, unknown>>[],
>(options: {
	ledgerApiUrl: string;
	apiPathPrefix?: string;
	timeoutMs?: number;
	plugins: TPlugins;
}): Promise<NexusClient & InferNexusClientPlugins<TPlugins>> {
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
		apiPathPrefix: options.apiPathPrefix,
		getToken,
		timeoutMs: options.timeoutMs,
		middlewares,
	});

	const packages = new PackageResolver(http);

	const contracts = new ContractQuery(http, packages);
	const commands = new CommandSubmitter(http, packages);

	const client: NexusClient = {
		config: {
			ledgerApiUrl: options.ledgerApiUrl,
			apiPathPrefix: options.apiPathPrefix,
			timeoutMs: options.timeoutMs,
		},
		packages,
		http,
		auth: {
			partyId: new PartyIdResolver(http),
		},
		ledger: {
			contracts,
			interfaces: new InterfaceQuery(http, packages),
			commands,
			identity: new LedgerIdentity(http),
		},
		query: contracts.query.bind(contracts),
		exercise: commands.exercise.bind(commands),
		getToken,
		getCachedToken: () => authPlugin?.auth?.getCachedToken?.() ?? null,
	};

	const dispatchRefresh = (newToken: string) => {
		for (const p of options.plugins) {
			p.onTokenRefreshed?.(newToken);
		}
	};

	for (const p of options.plugins) {
		if (p.id.endsWith("-auth") && p.setRefreshDispatcher) {
			p.setRefreshDispatcher(dispatchRefresh);
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
	} as NexusClient & InferNexusClientPlugins<TPlugins>;
}
