import { JwtManager } from "./auth/jwt-manager.ts";
import { PartyIdResolver } from "./auth/party-id-resolver.ts";
import { SessionManager } from "./auth/session-manager.ts";
import { CantonClient } from "./client/canton-client.ts";
import { CommandSubmitter } from "./ledger/command-submitter.ts";
import { ContractQuery } from "./ledger/contract-query.ts";
import { LedgerIdentity } from "./ledger/ledger-identity.ts";
import type { NexusConfig } from "./types/index.ts";

// ─── Public API surface ───────────────────────────────────────────────────────

export { JwtManager } from "./auth/jwt-manager.ts";
export { formatParty, PartyIdResolver } from "./auth/party-id-resolver.ts";
export { generateEncryptionKey, SessionManager } from "./auth/session-manager.ts";

export { CantonClient } from "./client/canton-client.ts";
export { CommandSubmitter } from "./ledger/command-submitter.ts";
export { ContractQuery } from "./ledger/contract-query.ts";
export { LedgerIdentity } from "./ledger/ledger-identity.ts";
export type {
	ActiveContract,
	ActiveContractsResponse,
	AuthConfig,
	CantonParty,
	CantonUser,
	Command,
	ContractId,
	CreateCommand,
	ExerciseCommand,
	JwtAuthConfig,
	LedgerEnd,
	NexusConfig,
	NexusSession,
	OidcAuthConfig,
	SandboxAuthConfig,
	SubmitRequest,
	SubmitResult,
	SynchronizerInfo,
	TemplateId,
} from "./types/index.ts";
export { NexusAuthError, NexusError, NexusLedgerError } from "./types/index.ts";

// ─── NexusClient ──────────────────────────────────────────────────────────────

export interface NexusClient {
	/** Raw Canton HTTP client — use for custom requests */
	readonly http: CantonClient;
	/** Auth primitives */
	readonly auth: {
		readonly jwt: JwtManager;
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

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a fully configured Nexus client.
 *
 * @example
 * ```ts
 * // Sandbox (development)
 * const nexus = createNexusClient({
 *   ledgerApiUrl: "http://localhost:7575",
 *   auth: { type: "sandbox", secret: "secret", userId: "alice", partyId: "Alice::..." },
 * });
 *
 * // Production JWT
 * const nexus = createNexusClient({
 *   ledgerApiUrl: "https://ledger.example.com",
 *   auth: { type: "jwt", token: process.env.CANTON_TOKEN! },
 * });
 * ```
 */
export function createNexusClient(config: NexusConfig): NexusClient {
	const jwt = new JwtManager(config.auth);
	const getToken = () => jwt.getToken();

	const http = new CantonClient({
		baseUrl: config.ledgerApiUrl,
		getToken,
		timeoutMs: config.timeoutMs,
	});

	const partyId = new PartyIdResolver({
		baseUrl: config.ledgerApiUrl,
		getToken,
	});

	const session = new SessionManager();

	const contracts = new ContractQuery(http);
	const commands = new CommandSubmitter(http);
	const identity = new LedgerIdentity(http);

	return {
		http,
		auth: { jwt, partyId, session },
		ledger: { contracts, commands, identity },
		getToken,
	};
}
