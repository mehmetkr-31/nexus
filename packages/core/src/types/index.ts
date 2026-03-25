// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthType = "sandbox" | "jwt" | "oidc";

export interface SandboxAuthConfig {
  type: "sandbox";
  /** HMAC256 secret used in Canton Sandbox dev mode */
  secret: string;
  userId: string;
  partyId: string;
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
  auth: AuthConfig;
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
}

export interface ActiveContractsResponse<T = Record<string, unknown>> {
  contracts: ActiveContract<T>[];
  nextPageToken?: string;
}

// ─── Commands ────────────────────────────────────────────────────────────────

export interface CreateCommand<T = Record<string, unknown>> {
  type: "create";
  templateId: string | TemplateId;
  createArguments: T;
}

export interface ExerciseCommand<T = Record<string, unknown>> {
  type: "exercise";
  templateId: string | TemplateId;
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
  transactionId: string;
  commandId: string;
  offset: string;
  completedAt: string;
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
