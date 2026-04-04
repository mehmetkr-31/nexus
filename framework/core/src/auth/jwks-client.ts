import { NexusAuthError } from "../types/index";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single JSON Web Key as defined by RFC 7517.
 * Named `NexusJwk` to avoid collision with the DOM `JsonWebKey` type.
 */
export interface NexusJwk {
	/** Key type — "RSA" or "EC" */
	kty: string;
	/** Key ID — used to select the correct key when multiple keys exist in the set */
	kid?: string;
	/** Public key use — "sig" (signing) or "enc" (encryption) */
	use?: string;
	/** Key operations */
	key_ops?: string[];
	/** Algorithm — e.g. "RS256", "ES256" */
	alg?: string;

	// RSA key fields
	/** RSA modulus (base64url) */
	n?: string;
	/** RSA public exponent (base64url) */
	e?: string;

	// EC key fields
	/** EC curve — "P-256", "P-384", "P-521" */
	crv?: string;
	/** EC x coordinate (base64url) */
	x?: string;
	/** EC y coordinate (base64url) */
	y?: string;
}

export interface NexusJwkSet {
	keys: NexusJwk[];
}

export interface JwksClientOptions {
	/** The JWKS URI to fetch keys from, e.g. `https://idp.example.com/.well-known/jwks.json` */
	jwksUri: string;
	/**
	 * Cache TTL in milliseconds. Default: 5 minutes.
	 * Keys are re-fetched from the JWKS URI when the cache expires.
	 */
	cacheTtlMs?: number;
	/**
	 * Request timeout in milliseconds for JWKS fetch. Default: 10 seconds.
	 */
	timeoutMs?: number;
	/**
	 * If true, force a fresh fetch even when the cache is still valid.
	 * Useful after receiving a JWT with an unknown `kid`.
	 */
}

// ─── JwksClient ──────────────────────────────────────────────────────────────

/**
 * Fetches and caches JSON Web Key Sets (JWKS) from a remote URI.
 *
 * Used with `verifyJwt()` to validate RS256/ES256 tokens issued by external
 * identity providers (Keycloak, Auth0, Azure AD, etc.) and wired into
 * Canton's IdentityProviderConfig via a JWKS URI.
 *
 * @example
 * ```ts
 * const jwks = new JwksClient({
 *   jwksUri: "https://keycloak.example.com/realms/canton/.well-known/jwks.json",
 * });
 *
 * // Verify a Canton RS256 token
 * const header = decodeJwtHeader(token);
 * const key = await jwks.getKey(header.kid);
 * const payload = await verifyJwt(token, { publicKey: key });
 * ```
 */
export class JwksClient {
	private readonly jwksUri: string;
	private readonly cacheTtlMs: number;
	private readonly timeoutMs: number;

	/** In-memory key cache: kid → CryptoKey */
	private keyCache: Map<string, CryptoKey> = new Map();
	/** Full JWKS cache (for keys without kid) */
	private rawKeys: NexusJwk[] = [];
	private cacheExpiresAt = 0;

	constructor(options: JwksClientOptions) {
		this.jwksUri = options.jwksUri;
		this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000; // 5 minutes
		this.timeoutMs = options.timeoutMs ?? 10_000;
	}

	/**
	 * Get a `CryptoKey` for the given `kid` (Key ID).
	 *
	 * Fetches and caches the JWKS on first use (or after cache expiry).
	 * If `kid` is not found in the cached keys, automatically re-fetches
	 * the JWKS once in case the IdP has rotated keys.
	 *
	 * @param kid - The Key ID from the JWT header. If omitted, returns the
	 *   first usable signing key in the JWKS (only safe when there is exactly one).
	 * @throws {NexusAuthError} if the key is not found or cannot be imported.
	 */
	async getKey(kid?: string): Promise<CryptoKey> {
		await this._ensureLoaded();

		// Try from cache first
		if (kid) {
			const cached = this.keyCache.get(kid);
			if (cached) return cached;

			// Cache miss — re-fetch once in case keys were rotated
			await this._fetchAndCache(true);
			const refreshed = this.keyCache.get(kid);
			if (refreshed) return refreshed;

			throw new NexusAuthError(`JWKS key not found: kid="${kid}" not present in ${this.jwksUri}`);
		}

		// No kid — return first available signing key
		const firstKey = this.rawKeys.find((k) => k.use === "sig" || k.use === undefined);
		if (!firstKey) {
			throw new NexusAuthError(`JWKS at ${this.jwksUri} contains no usable signing keys`);
		}
		return this._importKey(firstKey);
	}

	/**
	 * Pre-load the JWKS. Call this during application startup to avoid
	 * the first-request latency of lazy loading.
	 */
	async preload(): Promise<void> {
		await this._fetchAndCache(true);
	}

	/** Invalidate the cache, forcing a re-fetch on the next `getKey()` call. */
	invalidate(): void {
		this.keyCache.clear();
		this.rawKeys = [];
		this.cacheExpiresAt = 0;
	}

	// ─── Internal ────────────────────────────────────────────────────────────

	private async _ensureLoaded(): Promise<void> {
		if (Date.now() < this.cacheExpiresAt && this.rawKeys.length > 0) return;
		await this._fetchAndCache(false);
	}

	private async _fetchAndCache(force: boolean): Promise<void> {
		if (!force && Date.now() < this.cacheExpiresAt && this.rawKeys.length > 0) return;

		let jwks: NexusJwkSet;
		try {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), this.timeoutMs);
			const res = await fetch(this.jwksUri, {
				signal: controller.signal,
				headers: { Accept: "application/json" },
			}).finally(() => clearTimeout(timer));

			if (!res.ok) {
				throw new NexusAuthError(`JWKS fetch failed: HTTP ${res.status} from ${this.jwksUri}`);
			}
			jwks = (await res.json()) as NexusJwkSet;
		} catch (err) {
			if (err instanceof NexusAuthError) throw err;
			throw new NexusAuthError(`JWKS fetch error from ${this.jwksUri}: ${String(err)}`);
		}

		if (!Array.isArray(jwks.keys)) {
			throw new NexusAuthError(`Invalid JWKS response from ${this.jwksUri}: missing "keys" array`);
		}

		// Import all keys with a kid eagerly; others are imported lazily
		this.keyCache.clear();
		this.rawKeys = jwks.keys;

		for (const jwk of jwks.keys) {
			if (jwk.kid && (jwk.use === "sig" || jwk.use === undefined)) {
				try {
					const cryptoKey = await this._importKey(jwk);
					this.keyCache.set(jwk.kid, cryptoKey);
				} catch {
					// Skip keys that fail to import (e.g. unsupported algorithm)
				}
			}
		}

		this.cacheExpiresAt = Date.now() + this.cacheTtlMs;
	}

	/**
	 * Import a JWK into a WebCrypto `CryptoKey` for signature verification.
	 */
	async _importKey(jwk: NexusJwk): Promise<CryptoKey> {
		const alg = jwk.alg ?? _inferAlgorithm(jwk);

		if (alg === "RS256" || alg === "RS512") {
			return crypto.subtle.importKey(
				"jwk",
				// NexusJwk is structurally compatible with the WebCrypto JsonWebKey;
				// cast via unknown because tsconfig lib:ESNext omits DOM types.
				jwk as unknown as { kty: string },
				{ name: "RSASSA-PKCS1-v1_5", hash: alg === "RS512" ? "SHA-512" : "SHA-256" },
				false,
				["verify"],
			);
		}

		if (alg === "ES256" || alg === "ES384" || alg === "ES512") {
			const namedCurve = jwk.crv ?? _inferCurve(alg);
			return crypto.subtle.importKey(
				"jwk",
				jwk as unknown as { kty: string },
				{ name: "ECDSA", namedCurve },
				false,
				["verify"],
			);
		}

		throw new NexusAuthError(
			`JwksClient: unsupported key algorithm "${alg}" for key kid="${jwk.kid ?? "(none)"}"`,
		);
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _inferAlgorithm(jwk: NexusJwk): string {
	if (jwk.kty === "RSA") return "RS256";
	if (jwk.kty === "EC") {
		if (jwk.crv === "P-521") return "ES512";
		if (jwk.crv === "P-384") return "ES384";
		return "ES256";
	}
	throw new NexusAuthError(`JwksClient: cannot infer algorithm for kty="${jwk.kty}"`);
}

function _inferCurve(alg: string): string {
	if (alg === "ES512") return "P-521";
	if (alg === "ES384") return "P-384";
	return "P-256";
}
