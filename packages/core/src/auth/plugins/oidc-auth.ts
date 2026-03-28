import type { NexusPlugin } from "../../types/plugin.ts";
import { JwtManager } from "../jwt-manager.ts";

// ─── OidcAuthOptions ──────────────────────────────────────────────────────────

export interface OidcAuthOptions {
	/** OIDC token endpoint URL */
	tokenEndpoint: string;
	clientId: string;
	clientSecret?: string;
	/** Additional OAuth scopes beyond `daml_ledger_api` */
	scopes?: string[];
}

// ─── oidcAuth ─────────────────────────────────────────────────────────────────

/**
 * Auth plugin for OIDC client credentials flow.
 * Fetches access tokens from an OIDC provider automatically.
 *
 * @example
 * ```ts
 * plugins: [
 *   oidcAuth({
 *     tokenEndpoint: "https://auth.example.com/token",
 *     clientId: "canton-app",
 *     clientSecret: process.env.OIDC_SECRET,
 *   }),
 * ]
 * ```
 */
export function oidcAuth(options: OidcAuthOptions): NexusPlugin {
	const manager = new JwtManager({ type: "oidc", ...options });
	return {
		id: "oidc-auth",
		auth: { getToken: () => manager.getToken() },
	};
}
