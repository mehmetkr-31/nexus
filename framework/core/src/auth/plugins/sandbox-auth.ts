import type { NexusPlugin } from "../../types/plugin";
import { JwtManager } from "../jwt-manager";

// ─── SandboxAuthOptions ───────────────────────────────────────────────────────

export interface SandboxAuthContext {
	/** Request headers (for extracting X-Sandbox-User, etc.) */
	headers: Headers;
	/** Request URL (for extracting query params) */
	url: string;
}

export interface SandboxAuthOptions {
	/**
	 * Static user ID for single-user mode (backward compatible).
	 * @example "alice"
	 */
	userId?: string;

	/**
	 * Dynamic user ID resolver for multi-user mode.
	 * Called per-request to determine the user ID.
	 * Takes precedence over static `userId`.
	 *
	 * @example
	 * ```ts
	 * sandboxAuth({
	 *   secret: "secret",
	 *   getUserId: (ctx) => {
	 *     return ctx.headers.get('X-Sandbox-User') ?? 'alice';
	 *   }
	 * })
	 * ```
	 */
	getUserId?: (context: SandboxAuthContext) => string | Promise<string>;

	/** HMAC-256 secret used for token signing in Canton Sandbox dev mode */
	secret: string;

	/** Canton party ID for this user (only used in static single-user mode) */
	partyId?: string;
}

/**
 * Extended plugin returned by `sandboxAuth()`.
 * Includes `getAdminToken()` for provisioning operations (party allocation, user creation).
 */
export interface SandboxAuthPlugin extends NexusPlugin {
	/** Get an administrative token for sandbox provisioning operations. NOT for production use. */
	getAdminToken(): Promise<string>;
}

// ─── sandboxAuth ──────────────────────────────────────────────────────────────

/**
 * Auth plugin for Canton Sandbox development mode.
 * Creates self-signed HMAC-256 JWTs — **NOT for production use**.
 *
 * Supports both single-user (static) and multi-user (dynamic) modes.
 *
 * @example Single-user mode (backward compatible)
 * ```ts
 * sandboxAuth({
 *   userId: "alice",
 *   secret: "secret",
 *   partyId: "Alice::122059a10c67ef1bb...",
 * })
 * ```
 *
 * @example Multi-user mode (production-like)
 * ```ts
 * sandboxAuth({
 *   secret: "secret",
 *   getUserId: (ctx) => {
 *     // Read from header, query param, etc.
 *     return ctx.headers.get('X-Sandbox-User') ?? 'alice';
 *   }
 * })
 * ```
 */
export function sandboxAuth(
	options: SandboxAuthOptions,
): SandboxAuthPlugin & { setRefreshDispatcher: (cb: (t: string) => void) => void } {
	// Validate: either userId or getUserId must be provided
	if (!options.userId && !options.getUserId) {
		throw new Error("sandboxAuth: Either 'userId' or 'getUserId' must be provided");
	}

	let dispatcher: ((t: string) => void) | undefined;

	// For JwtManager, we need a static userId. Use provided userId or default to "alice"
	const staticUserId = options.userId ?? "alice";

	const manager = new JwtManager(
		{ type: "sandbox", userId: staticUserId, secret: options.secret, partyId: options.partyId },
		(newToken) => {
			dispatcher?.(newToken);
		},
	);

	return {
		id: "sandbox-auth",
		auth: {
			getToken: () => manager.getToken(),
			getCachedToken: () => manager.getCachedToken(),
		},
		getAdminToken: () => manager.getAdminToken(),
		setRefreshDispatcher: (cb: (t: string) => void) => {
			dispatcher = cb;
		},
		// Store options for route handler to access
		$Infer: { sandboxOptions: options } as any,
	};
}
