import type { NexusPlugin } from "../../types/plugin.ts";
import { JwtManager } from "../jwt-manager.ts";

// ─── JwtAuthOptions ───────────────────────────────────────────────────────────

export interface JwtAuthOptions {
	/** Pre-issued JWT bearer token */
	token: string;
	/**
	 * Optional callback invoked when the token is within 30 seconds of expiry.
	 * If omitted, the static token is used until it expires.
	 */
	refreshToken?: () => Promise<string>;
}

// ─── jwtAuth ──────────────────────────────────────────────────────────────────

/**
 * Auth plugin for static or refreshable JWT tokens.
 *
 * @example
 * ```ts
 * // Static token
 * plugins: [jwtAuth({ token: process.env.CANTON_TOKEN! })]
 *
 * // With refresh callback
 * plugins: [jwtAuth({ token: currentToken, refreshToken: () => fetchNewToken() })]
 * ```
 */
export function jwtAuth(
	options: JwtAuthOptions,
): NexusPlugin & { setRefreshDispatcher: (cb: (t: string) => void) => void } {
	let dispatcher: ((t: string) => void) | undefined;
	const manager = new JwtManager({ type: "jwt", ...options }, (newToken) => {
		dispatcher?.(newToken);
	});
	return {
		id: "jwt-auth",
		auth: { getToken: () => manager.getToken() },
		setRefreshDispatcher: (cb: (t: string) => void) => {
			dispatcher = cb;
		},
	};
}
