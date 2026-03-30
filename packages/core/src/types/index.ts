// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthType = "sandbox" | "jwt" | "oidc";

export interface SandboxAuthConfig {
	type: "sandbox";
	/** HMAC256 secret used in Canton Sandbox dev mode */
	secret: string;
	userId: string;
	partyId?: string;
}

export interface JwtAuthConfig {
	type: "jwt";
	/** Pre-issued JWT bearer token */
	token: string;
	/** Optional: refresh callback invoked when token is expiring */
	refreshToken?: () => Promise<string>;
}

export interface OidcAuthConfig {
	type: "oidc";
	/** OIDC token endpoint */
	tokenEndpoint: string;
	clientId: string;
	clientSecret?: string;
	/** Additional scopes beyond `daml_ledger_api` */
	scopes?: string[];
}

export type AuthConfig = SandboxAuthConfig | JwtAuthConfig | OidcAuthConfig;

// ─── Client Config ───────────────────────────────────────────────────────────

export interface NexusConfig {
	/** Canton JSON Ledger API base URL, e.g. http://localhost:7575 */
	ledgerApiUrl: string;
	auth?: AuthConfig;
	/** Request timeout in milliseconds. Default: 30000 */
	timeoutMs?: number;
}

// ─── Canton Identity ─────────────────────────────────────────────────────────

export interface CantonParty {
	partyId: string;
	displayName?: string;
	isLocal: boolean;
}

export interface CantonUser {
	userId: string;
	primaryParty?: string;
	isDeactivated: boolean;
	metadata?: Record<string, string>;
}

// ─── Contracts ───────────────────────────────────────────────────────────────

export interface ContractId {
	contractId: string;
}

export interface TemplateId {
	packageId: string;
	moduleName: string;
	entityName: string;
}

export interface ActiveContract<T = Record<string, unknown>> {
	contractId: string;
	templateId: TemplateId;
	payload: T;
	createdAt: string;
	signatories: string[];
	observers: string[];
	/** If true, this contract is currently awaiting consensus on the ledger. */
	isOptimistic?: boolean;
}

export interface ActiveContractsResponse<T = Record<string, unknown>> {
	contracts: ActiveContract<T>[];
	nextPageToken?: string;
}

// ─── Commands ────────────────────────────────────────────────────────────────

export interface CreateCommand<T = Record<string, unknown>> {
	type: "create";
	templateId: string | TemplateId | TemplateDescriptor;
	createArguments: T;
}

export interface ExerciseCommand<T = Record<string, unknown>> {
	type: "exercise";
	templateId: string | TemplateId | TemplateDescriptor;
	contractId: string;
	choice: string;
	choiceArgument: T;
}

export type Command = CreateCommand | ExerciseCommand;

export interface SubmitRequest {
	commands: Command[];
	actAs: string[];
	readAs?: string[];
	commandId?: string;
	workflowId?: string;
}

export interface SubmitResult {
	updateId: string;
	completionOffset: number;
}

/**
 * Represents the lifecycle stages of a Canton transaction.
 */
export type TransactionStatus = "pending" | "confirmed" | "finalized" | "failed";

// ─── Transaction Events ───────────────────────────────────────────────────────

/**
 * Represents a Daml template by its logical name.
 * Used by the `PackageResolver` to lookup the corresponding Package ID at runtime.
 */
export interface TemplateDescriptor {
	/** Human-readable package name, e.g. "iou" */
	packageName: string;
	/** Daml module name, e.g. "Iou" */
	moduleName: string;
	/** Daml entity name, e.g. "Iou" */
	entityName: string;
}

/** Hex-encoded package ID, e.g. "122059a10c67ef1bb38e4e7ff3fd9c827e2e6cbbfd68bb5cd8fa4c0c56fecdf0734b" */
export type PackageId = string;

export interface ExercisedEvent<TResult = unknown> {
	nodeId: number;
	offset: number;
	contractId: string;
	templateId: TemplateId;
	/** Set if the choice was exercised via a Daml interface */
	interfaceId?: string;
	choice: string;
	choiceArgument: unknown;
	actingParties: string[];
	/** True if the contract was archived by this exercise */
	consuming: boolean;
	witnessParties: string[];
	/** The Daml return value of the choice */
	exerciseResult: TResult;
	childNodeIds: number[];
	packageName: string;
}

export interface ArchivedEvent {
	nodeId: number;
	offset: number;
	contractId: string;
	templateId: TemplateId;
	witnessParties: string[];
	packageName: string;
	implementedInterfaces?: string[];
}

export type TransactionEvent<T = unknown, TResult = unknown> =
	| { type: "created"; contract: ActiveContract<T> }
	| { type: "archived"; contractId: string; templateId: TemplateId }
	| { type: "exercised"; event: ExercisedEvent<TResult> };

export interface TransactionResult<T = unknown, TResult = unknown> {
	transactionId: string;
	commandId: string;
	offset: number;
	completedAt: string;
	events: TransactionEvent<T, TResult>[];
}

/** Result of an exercise command — includes the Daml choice return value */
export interface ExerciseResult<TResult = unknown> {
	transactionId: string;
	commandId: string;
	offset: number;
	completedAt: string;
	/** The Daml choice return value */
	result: TResult;
}

// ─── Interface Views ──────────────────────────────────────────────────────────

/** A contract viewed through a Daml interface */
export interface ActiveInterface<
	TView = Record<string, unknown>,
	TPayload = Record<string, unknown>,
> {
	contractId: string;
	templateId: TemplateId;
	payload: TPayload;
	interfaceId: string;
	/** The decoded interface view value */
	interfaceView: TView;
	signatories: string[];
	observers: string[];
	createdAt: string;
	/** If true, this contract is currently awaiting consensus on the ledger. */
	isOptimistic?: boolean;
}

export interface ActivateInterfaceOptions {
	interfaceId: string | TemplateId | TemplateDescriptor;
	parties?: string[];
	pageToken?: string;
	pageSize?: number;
	includeCreateArguments?: boolean;
}

export interface ActiveInterfacesResponse<
	TView = Record<string, unknown>,
	TPayload = Record<string, unknown>,
> {
	interfaces: ActiveInterface<TView, TPayload>[];
	nextPageToken?: string;
}

// ─── Streaming ────────────────────────────────────────────────────────────────

/** Returned by streaming methods — call close() to stop the stream */
export interface StreamHandle {
	close: () => void;
	/**
	 * Inject a new bearer token into the active WebSocket stream.
	 * Use this to keep long-lived streams alive after JWT rotation.
	 */
	updateToken: (newToken: string) => void;
	/** True when the WebSocket connection is open. Distinct from `isLive` (ACS snapshot). */
	readonly connected: boolean;
}

export interface StreamHandlers<T = Record<string, unknown>> {
	/** Called for each active contract in the initial ACS snapshot and new creates */
	onCreate?: (contract: ActiveContract<T>) => void;
	/** Called when a contract is archived */
	onArchive?: (contractId: string, templateId: TemplateId) => void;
	/** Called when the initial ACS snapshot is fully delivered */
	onLive?: () => void;
	onError?: (error: Error) => void;
	onClose?: () => void;
}

// ─── Ledger State ────────────────────────────────────────────────────────────

export interface LedgerEnd {
	offset: string;
}

export interface SynchronizerInfo {
	synchronizerId: string;
	synchronizerAlias: string;
	connected: boolean;
}

// ─── Session (SSR / Next.js) ─────────────────────────────────────────────────

export interface NexusSession {
	token: string;
	partyId: string;
	userId?: string;
	expiresAt: number;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class NexusError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly statusCode?: number,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "NexusError";
	}
}

export class NexusAuthError extends NexusError {
	constructor(message: string, details?: unknown) {
		super(message, "AUTH_ERROR", 401, details);
		this.name = "NexusAuthError";
	}
}

export class NexusLedgerError extends NexusError {
	constructor(message: string, statusCode?: number, details?: unknown) {
		super(message, "LEDGER_ERROR", statusCode, details);
		this.name = "NexusLedgerError";
	}
}

// ─── Nexus Client & Config ───────────────────────────────────────────────────

import type { PartyIdResolver } from "../auth/party-id-resolver.ts";
import type { SessionManager } from "../auth/session-manager.ts";
import type { CantonClient } from "../client/canton-client.ts";
import type { CommandSubmitter } from "../ledger/command-submitter.ts";
import type { ContractQuery } from "../ledger/contract-query.ts";
import type { InterfaceQuery } from "../ledger/interface-query.ts";
import type { LedgerIdentity } from "../ledger/ledger-identity.ts";
import type { PackageResolver } from "../ledger/package-resolver.ts";

export interface NexusConfig {
	/** Canton JSON Ledger API base URL, e.g. http://localhost:7575 */
	ledgerApiUrl: string;
	/**
	 * Path prefix for the Canton JSON Ledger API.
	 * Default: "/v2"
	 */
	apiPathPrefix?: string;
	auth?: AuthConfig;
	/** Request timeout in milliseconds. Default: 30000 */
	timeoutMs?: number;
}

export interface NexusClient {
	config: NexusConfig;
	http: CantonClient;
	packages?: PackageResolver;
	auth: {
		partyId: PartyIdResolver;
		session: SessionManager;
	};
	ledger: {
		contracts: ContractQuery;
		interfaces: InterfaceQuery;
		commands: CommandSubmitter;
		identity: LedgerIdentity;
	};
	getToken: () => Promise<string>;
	getCachedToken: () => string | null;
}
