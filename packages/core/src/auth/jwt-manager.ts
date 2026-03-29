import { type AuthConfig, NexusAuthError } from "../types/index";

// ─── Token payload ────────────────────────────────────────────────────────────

interface JwtPayload {
	sub?: string;
	exp?: number;
	nbf?: number;
	iat?: number;
	aud?: string | string[];
	scope?: string;
}

function decodeJwtPayload(token: string): JwtPayload {
	const parts = token.split(".");
	if (parts.length !== 3 || !parts[1]) {
		throw new NexusAuthError("Invalid JWT format");
	}
	try {
		// Bun's atob handles base64url by replacing chars
		const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
		return JSON.parse(atob(padded)) as JwtPayload;
	} catch {
		throw new NexusAuthError("Failed to decode JWT payload");
	}
}

function isExpiringSoon(payload: JwtPayload, bufferMs = 30_000): boolean {
	if (!payload.exp) return false;
	return payload.exp * 1000 - Date.now() < bufferMs;
}

// ─── Sandbox token generator ──────────────────────────────────────────────────

/**
 * Creates a self-signed HMAC256 JWT for Canton Sandbox development mode.
 * NOT for production use.
 */
async function createSandboxToken(
	userId: string,
	partyId: string | undefined,
	secret: string,
	admin = false,
): Promise<string> {
	const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	const now = Math.floor(Date.now() / 1000);
	const claims: JwtPayload = {
		sub: userId,
		aud: admin
			? "https://daml.com/jwt/aud/participant/admin"
			: `https://daml.com/jwt/aud/participant/sandbox`,
		scope: "daml_ledger_api",
		iat: now,
		exp: now + 86400, // 24h for sandbox
	};
	// Include actAs party in payload per Canton sandbox convention if provided
	const payloadObj = {
		...claims,
		...(!admin && partyId
			? { "https://daml.com/ledger-api": { actAs: [partyId], readAs: [] } }
			: {}),
	};
	const payload = btoa(JSON.stringify(payloadObj))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	const signingInput = `${header}.${payload}`;
	const keyData = new TextEncoder().encode(secret);
	const msgData = new TextEncoder().encode(signingInput);

	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, msgData);
	const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	return `${signingInput}.${signature}`;
}

// ─── JwtManager ──────────────────────────────────────────────────────────────

export class JwtManager {
	private cachedToken: string | null = null;
	private readonly config: AuthConfig;

	constructor(config: AuthConfig) {
		this.config = config;
	}

	async getToken(): Promise<string> {
		if (this.cachedToken && !this.shouldRefresh(this.cachedToken)) {
			return this.cachedToken;
		}

		const token = await this.fetchFreshToken();
		this.cachedToken = token;
		return token;
	}

	/** Generate an administrative token for sandbox mode */
	async getAdminToken(): Promise<string> {
		const config = this.config;
		if (config.type !== "sandbox") {
			throw new Error("Admin tokens only supported in sandbox mode");
		}
		return createSandboxToken(config.userId, undefined, config.secret, true);
	}

	/** Force-refresh: useful after a 401 response */
	async refreshToken(): Promise<string> {
		this.cachedToken = null;
		return this.getToken();
	}

	/** Expose current cached token without triggering a fetch */
	getCachedToken(): string | null {
		return this.cachedToken;
	}

	private shouldRefresh(token: string): boolean {
		try {
			const payload = decodeJwtPayload(token);
			return isExpiringSoon(payload);
		} catch {
			return true;
		}
	}

	private async fetchFreshToken(): Promise<string> {
		const config = this.config;

		if (config.type === "sandbox") {
			return createSandboxToken(config.userId, config.partyId, config.secret);
		}

		if (config.type === "jwt") {
			// If a refresh callback is provided, use it when current token is expiring
			if (this.cachedToken && config.refreshToken && this.shouldRefresh(this.cachedToken)) {
				return config.refreshToken();
			}
			// On first call or no refresh callback: return the static token
			if (!this.cachedToken) {
				return config.token;
			}
			// Static token with no refresh — just return it even if expiring
			return config.token;
		}

		if (config.type === "oidc") {
			const params = new URLSearchParams({
				grant_type: "client_credentials",
				client_id: config.clientId,
				scope: ["daml_ledger_api", ...(config.scopes ?? [])].join(" "),
			});
			if (config.clientSecret) {
				params.set("client_secret", config.clientSecret);
			}

			const res = await fetch(config.tokenEndpoint, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: params.toString(),
			});

			if (!res.ok) {
				throw new NexusAuthError(
					`OIDC token endpoint returned ${res.status}`,
					await res.text().catch(() => undefined),
				);
			}

			const data = (await res.json()) as { access_token?: string };
			if (!data.access_token) {
				throw new NexusAuthError("OIDC response missing access_token");
			}
			return data.access_token;
		}

		throw new NexusAuthError(`Unknown auth type: ${String((config as AuthConfig).type)}`);
	}
}
