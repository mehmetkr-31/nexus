import { JwksClient } from "../jwks-client.ts";
import type { NexusPlugin } from "../../types/plugin.ts";
import { JwtManager } from "../jwt-manager.ts";
import { decodeJwtHeader, verifyJwt } from "../../utils/jwt.ts";

// ─── OidcAuthOptions ──────────────────────────────────────────────────────────

export interface OidcAuthOptions {
	/** OIDC token endpoint URL */
	tokenEndpoint: string;
	clientId: string;
	clientSecret?: string;
	/** Additional OAuth scopes beyond `daml_ledger_api` */
	scopes?: string[];
	/**
	 * JWKS URI for verifying tokens issued by this OIDC provider.
	 * When provided, every fetched token is verified against the JWKS before use.
	 *
	 * Typically `<issuer>/.well-known/jwks.json`.
	 * For Canton's IdentityProviderConfig, this is the URI you configure
	 * in the `jwks_uri` field so the participant node can verify tokens.
	 *
	 * @example "https://keycloak.example.com/realms/canton/.well-known/jwks.json"
	 */
	jwksUri?: string;
	/**
	 * Cache TTL for JWKS keys in milliseconds. Default: 5 minutes.
	 * Only used when `jwksUri` is set.
	 */
	jwksCacheTtlMs?: number;
	/**
	 * Expected `iss` (issuer) claim value for token verification.
	 * Only used when `jwksUri` is set.
	 */
	issuer?: string;
	/**
	 * Expected `aud` (audience) claim value(s) for token verification.
	 * Only used when `jwksUri` is set.
	 */
	audience?: string | string[];
}

// ─── oidcAuth ─────────────────────────────────────────────────────────────────

/**
 * Auth plugin for OIDC client credentials flow.
 * Fetches access tokens from an OIDC provider automatically.
 *
 * When `jwksUri` is provided, each fetched token is verified using the
 * provider's public keys — matching Canton's IdentityProviderConfig setup.
 *
 * @example
 * ```ts
 * // Basic usage
 * plugins: [
 *   oidcAuth({
 *     tokenEndpoint: "https://auth.example.com/token",
 *     clientId: "canton-app",
 *     clientSecret: process.env.OIDC_SECRET,
 *   }),
 * ]
 *
 * // With JWKS verification (production)
 * plugins: [
 *   oidcAuth({
 *     tokenEndpoint: "https://keycloak.example.com/realms/canton/protocol/openid-connect/token",
 *     clientId: "canton-app",
 *     clientSecret: process.env.OIDC_SECRET,
 *     jwksUri: "https://keycloak.example.com/realms/canton/.well-known/jwks.json",
 *     issuer: "https://keycloak.example.com/realms/canton",
 *     audience: "https://daml.com/jwt/aud/participant/sandbox-participant",
 *   }),
 * ]
 * ```
 */
export function oidcAuth(options: OidcAuthOptions): NexusPlugin & {
	setRefreshDispatcher: (cb: (t: string) => void) => void;
	/** The JWKS client used for token verification, if `jwksUri` was configured. */
	jwks?: JwksClient;
} {
	let dispatcher: ((t: string) => void) | undefined;

	// Build JWKS client if URI is provided
	const jwks = options.jwksUri
		? new JwksClient({
				jwksUri: options.jwksUri,
				cacheTtlMs: options.jwksCacheTtlMs,
			})
		: undefined;

	// Wrap the base oidc config with an optional post-fetch verification step
	const manager = new JwtManager(
		{
			type: "oidc",
			tokenEndpoint: options.tokenEndpoint,
			clientId: options.clientId,
			clientSecret: options.clientSecret,
			scopes: options.scopes,
		},
		(newToken) => {
			dispatcher?.(newToken);
		},
		// Pass the JWKS verifier as a post-fetch hook
		jwks
			? async (token: string) => {
					const header = decodeJwtHeader(token);
					const key = await jwks.getKey(header.kid);
					await verifyJwt(token, {
						publicKey: key,
						issuer: options.issuer,
						audience: options.audience,
					});
				}
			: undefined,
	);

	return {
		id: "oidc-auth",
		auth: {
			getToken: () => manager.getToken(),
			getCachedToken: () => manager.getCachedToken(),
		},
		setRefreshDispatcher: (cb: (t: string) => void) => {
			dispatcher = cb;
		},
		jwks,
	};
}
