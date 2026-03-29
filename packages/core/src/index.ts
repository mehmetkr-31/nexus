import { JwtManager } from "./auth/jwt-manager.ts";
import { PartyIdResolver } from "./auth/party-id-resolver.ts";
import { SessionManager } from "./auth/session-manager.ts";
import { CantonClient } from "./client/canton-client.ts";
import { CommandSubmitter } from "./ledger/command-submitter.ts";
import { ContractQuery } from "./ledger/contract-query.ts";
import { LedgerIdentity } from "./ledger/ledger-identity.ts";
import type { NexusConfig } from "./types/index.ts";
import type { NexusPlugin } from "./types/plugin.ts";

// ─── Public API ───────────────────────────────────────────────────────────────

// Core internals (advanced use)
export { JwtManager } from "./auth/jwt-manager.ts";
export { formatParty, PartyIdResolver } from "./auth/party-id-resolver.ts";
export type { JwtAuthOptions } from "./auth/plugins/jwt-auth.ts";
export { jwtAuth } from "./auth/plugins/jwt-auth.ts";
export type { OidcAuthOptions } from "./auth/plugins/oidc-auth.ts";
export { oidcAuth } from "./auth/plugins/oidc-auth.ts";
export type { SandboxAuthOptions, SandboxAuthPlugin } from "./auth/plugins/sandbox-auth.ts";
// Auth plugins
export { sandboxAuth } from "./auth/plugins/sandbox-auth.ts";
export { generateEncryptionKey, SessionManager } from "./auth/session-manager.ts";
export { CantonClient } from "./client/canton-client.ts";
export { CommandSubmitter } from "./ledger/command-submitter.ts";
export { ContractQuery } from "./ledger/contract-query.ts";
export { LedgerIdentity } from "./ledger/ledger-identity.ts";
export type { ProvisionSandboxUserOptions } from "./ledger/sandbox-provision.ts";
export { provisionSandboxUser } from "./ledger/sandbox-provision.ts";
// Domain types
// Legacy auth config types (for createNexusClient compat shim)
export type {
	ActiveContract,
	ActiveContractsResponse,
	ActiveInterface,
	ActiveInterfacesResponse,
	ArchivedEvent,
	AuthConfig,
	CantonParty,
	CantonUser,
	Command,
	ContractId,
	CreateCommand,
	ExerciseCommand,
	ExercisedEvent,
	ExerciseResult,
	JwtAuthConfig,
	LedgerEnd,
	NexusConfig,
	NexusSession,
	OidcAuthConfig,
	SandboxAuthConfig,
	StreamHandle,
	StreamHandlers,
	SubmitRequest,
	SubmitResult,
	SynchronizerInfo,
	TemplateId,
	TransactionEvent,
	TransactionResult,
} from "./types/index.ts";
export { NexusAuthError, NexusError, NexusLedgerError } from "./types/index.ts";
// Plugin types
export type { NexusPlugin } from "./types/plugin.ts";

// ─── NexusClient ──────────────────────────────────────────────────────────────

export interface NexusClient {
	/** Raw Canton HTTP client — use for custom requests */
	readonly http: CantonClient;
	/** Auth primitives */
	readonly auth: {
		readonly partyId: PartyIdResolver;
		readonly session: SessionManager;
	};
	/** Ledger operations */
	readonly ledger: {
		readonly contracts: ContractQuery;
		readonly commands: CommandSubmitter;
		readonly identity: LedgerIdentity;
	};
	/** Get the current bearer token */
	getToken(): Promise<string>;
}

// ─── createNexus (plugin-based factory) ───────────────────────────────────────

/**
 * Create a fully configured Nexus client using the plugin-based API.
 *
 * @example
 * ```ts
 * // Sandbox (development)
 * const nexus = createNexus({
 *   ledgerApiUrl: "http://localhost:7575",
 *   plugins: [sandboxAuth({ userId: "alice", secret: "secret", partyId: "Alice::..." })],
 * });
 *
 * // Production JWT
 * const nexus = createNexus({
 *   ledgerApiUrl: "https://ledger.example.com",
 *   plugins: [jwtAuth({ token: process.env.CANTON_TOKEN! })],
 * });
 *
 * // OIDC
 * const nexus = createNexus({
 *   ledgerApiUrl: "https://ledger.example.com",
 *   plugins: [oidcAuth({ tokenEndpoint: "...", clientId: "...", clientSecret: "..." })],
 * });
 * ```
 */
export function createNexus(options: {
	ledgerApiUrl: string;
	timeoutMs?: number;
	plugins: NexusPlugin[];
}): NexusClient {
	const authPlugin = options.plugins.find((p) => p.auth);
	if (!authPlugin?.auth) {
		throw new Error(
			"createNexus: at least one plugin must provide authentication. " +
				"Use sandboxAuth(), jwtAuth(), or oidcAuth().",
		);
	}

	const getToken = () =>
		authPlugin.auth?.getToken() ?? Promise.reject(new Error("No auth plugin provided"));

	const http = new CantonClient({
		baseUrl: options.ledgerApiUrl,
		getToken,
		timeoutMs: options.timeoutMs,
	});

	const partyId = new PartyIdResolver({
		baseUrl: options.ledgerApiUrl,
		getToken,
	});

	const session = new SessionManager();

	const contracts = new ContractQuery(http);
	const commands = new CommandSubmitter(http);
	const identity = new LedgerIdentity(http);

	return {
		http,
		auth: { partyId, session },
		ledger: { contracts, commands, identity },
		getToken,
	};
}

// ─── createNexusClient (legacy compat shim) ────────────────────────────────────

/**
 * @deprecated Use `createNexus()` with auth plugins instead.
 *
 * @example
 * ```ts
 * // Before:
 * createNexusClient({ ledgerApiUrl, auth: { type: "sandbox", ... } })
 *
 * // After:
 * createNexus({ ledgerApiUrl, plugins: [sandboxAuth({ ... })] })
 * ```
 */
export function createNexusClient(config: NexusConfig): NexusClient {
	const jwt = new JwtManager(config.auth);
	return createNexus({
		ledgerApiUrl: config.ledgerApiUrl,
		timeoutMs: config.timeoutMs,
		plugins: [{ id: "legacy-jwt-manager", auth: { getToken: () => jwt.getToken() } }],
	});
}
