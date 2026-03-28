import type { NexusPlugin } from "../../types/plugin.ts";
import { JwtManager } from "../jwt-manager.ts";

// ─── SandboxAuthOptions ───────────────────────────────────────────────────────

export interface SandboxAuthOptions {
	/** Canton sandbox user ID */
	userId: string;
	/** HMAC-256 secret used for token signing in Canton Sandbox dev mode */
	secret: string;
	/** Canton party ID for this user, e.g. "Alice::122059a10c67ef1bb..." */
	partyId: string;
}

// ─── sandboxAuth ──────────────────────────────────────────────────────────────

/**
 * Auth plugin for Canton Sandbox development mode.
 * Creates self-signed HMAC-256 JWTs — **NOT for production use**.
 *
 * @example
 * ```ts
 * import { createNexus, sandboxAuth } from "@nexus-framework/core";
 *
 * const nexus = createNexus({
 *   ledgerApiUrl: "http://localhost:7575",
 *   plugins: [
 *     sandboxAuth({
 *       userId: "alice",
 *       secret: "secret",
 *       partyId: "Alice::122059a10c67ef1bb38e4e7ff3fd9c827e2e6cbbfd68bb5cd8fa4c0c56fecdf0734b",
 *     }),
 *   ],
 * });
 * ```
 */
export function sandboxAuth(options: SandboxAuthOptions): NexusPlugin {
	const manager = new JwtManager({ type: "sandbox", ...options });
	return {
		id: "sandbox-auth",
		auth: { getToken: () => manager.getToken() },
	};
}
