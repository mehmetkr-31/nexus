import type { CantonClient } from "../client/canton-client.ts";

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
export interface NexusPlugin<
	TContext extends Record<string, unknown> = Record<string, unknown>,
> {
	/** Unique plugin identifier */
	id: string;

	/**
	 * Called once after the CantonClient is created.
	 * The returned value is available on the Nexus instance context.
	 */
	init?: (client: CantonClient) => Promise<TContext> | TContext;

	/**
	 * If provided, this plugin handles authentication by supplying a bearer token.
	 * Only the **first** auth plugin in the plugins array is used.
	 */
	auth?: {
		getToken: () => Promise<string>;
	};

	/** Type inference marker — mirrors the better-auth $Infer pattern */
	$Infer?: Record<string, unknown>;
}
