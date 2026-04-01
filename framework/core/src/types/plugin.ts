import type { NexusClient, NexusLedgerError } from "./index.ts";

// ─── Fetch Middleware ─────────────────────────────────────────────────────────

export interface RequestConfig {
	method: string;
	url: string;
	path: string;
	headers: Record<string, string>;
	body?: unknown;
}

export type {
	ActiveContract,
	ActiveContractsResponse,
	ActiveInterface,
	ActiveInterfacesResponse,
	Command,
	CompletionEvent,
	ContractQueryFilters,
	CreateCommand,
	DamlChoice,
	DamlTemplate,
	DamlTemplateIdentity,
	ExerciseCommand,
	ExerciseResult,
	LedgerEnd,
	NexusClient,
	NexusConfig,
	SubmitResult,
	SynchronizerInfo,
	TemplateDescriptor,
	TemplateId,
	TransactionResult,
	TransactionStatus,
} from "./index.ts";

export interface FetchMiddleware {
	onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
	onResponse?: (response: Response, config: RequestConfig) => void | Promise<void>;
	/**
	 * Called after the response JSON is decoded, but BEFORE Zod schema validation.
	 * Plugins can use this to transform the raw ledger data.
	 */
	onAfterResponse?: (json: unknown, config: RequestConfig) => unknown | Promise<unknown>;
	onError?: (error: NexusLedgerError, config: RequestConfig) => void | Promise<void>;
}

// ─── Type Helpers ─────────────────────────────────────────────────────────────

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;

/** Extract the context type contributed by a single plugin. */
export type InferPluginContext<P> = P extends NexusPlugin<infer T> ? T : Record<string, never>;

/** Merge all plugin contexts from an array into one intersection type. */
export type InferNexusPlugins<P extends readonly NexusPlugin[]> = UnionToIntersection<
	InferPluginContext<P[number]>
>;

// ─── NexusPlugin ─────────────────────────────────────────────────────────────

/**
 * Server-side plugin interface for extending Nexus with auth or init logic.
 *
 * Implement this interface to create reusable auth strategies or Canton client
 * extensions that can be composed via `createNexus({ plugins: [...] })`.
 *
 * @example
 * ```ts
 * const myPlugin: NexusPlugin = {
 *   id: "my-auth",
 *   auth: { getToken: async () => "my-token" },
 * };
 * ```
 */
export interface NexusPlugin<TContext extends Record<string, unknown> = Record<string, unknown>> {
	/** Unique plugin identifier */
	id: string;

	/**
	 * Called once after the NexusClient is created.
	 * The returned value is available on the Nexus instance context.
	 */
	init?: (client: NexusClient) => Promise<TContext> | TContext;

	/**
	 * If provided, this plugin handles authentication by supplying a bearer token.
	 * Only the **first** auth plugin in the plugins array is used.
	 */
	auth?: {
		getToken: () => Promise<string>;
		getCachedToken?: () => string | null;
	};

	/**
	 * Optional callback called whenever the session token is refreshed.
	 * Plugins can use this to update internal state (e.g. WebSocket connections).
	 */
	onTokenRefreshed?: (newToken: string) => void | Promise<void>;

	/**
	 * Internal: Sets a callback to be called when the token is refreshed by the auth plugin.
	 * Core uses this to dispatch refreshes to all other plugins.
	 */
	setRefreshDispatcher?: (dispatch: (newToken: string) => void) => void;

	/** Fetch middleware hooks for intercepting HTTP requests. */
	middleware?: FetchMiddleware;

	/** Type inference marker — mirrors the better-auth $Infer pattern */
	$Infer?: TContext;
}
