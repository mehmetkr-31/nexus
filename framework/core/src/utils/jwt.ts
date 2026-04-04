import { NexusAuthError } from "../types/index";

function toBufferSource(buf: Uint8Array): ArrayBuffer {
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

// ─── JwtPayload ───────────────────────────────────────────────────────────────

/**
 * Decoded payload of a Canton Ledger API JWT.
 *
 * Supports both token formats defined by the Canton authorization spec:
 * - Audience-based: `aud` = `"https://daml.com/jwt/aud/participant/<participantId>"`
 * - Scope-based:    `aud` = participantId, `scope` = `"daml_ledger_api"`
 *
 * @see https://docs.digitalasset.com/build/3.4/sdlc-howtos/applications/secure/authorization.html
 */
export interface JwtPayload {
	/** Token subject — Canton user ID */
	sub?: string;
	/** Expiry (seconds since Unix epoch) */
	exp?: number;
	/** Not-before (seconds since Unix epoch) */
	nbf?: number;
	/** Issued-at (seconds since Unix epoch) */
	iat?: number;
	/**
	 * Audience claim.
	 * - Audience-based token: `"https://daml.com/jwt/aud/participant/<participantId>"`
	 * - Scope-based token:    participant node ID (optional)
	 */
	aud?: string | string[];
	/**
	 * OAuth 2.0 scope.
	 * Scope-based tokens must include `"daml_ledger_api"`.
	 */
	scope?: string;
	/**
	 * Identity provider ID.
	 * Must be set for tokens issued by a non-default IDP.
	 * Match this against the `idpId` in Canton's IdentityProviderConfig.
	 */
	iss?: string;
	/**
	 * Key ID — identifies which key in a JWKS was used to sign this token.
	 * Present in the JWT header; merged into payload by `verifyJwt()`.
	 */
	kid?: string;
	/**
	 * Canton Ledger API claim (legacy / direct-rights format).
	 * Some configurations embed actAs/readAs directly in the token.
	 * The preferred production approach is the User Access Token model where
	 * rights are resolved server-side from the participant's user registry.
	 */
	"https://daml.com/ledger-api"?: {
		actAs: string[];
		readAs: string[];
		admin?: boolean;
	};
}

/** Raw JWT header fields */
export interface JwtHeader {
	alg: string;
	typ?: string;
	kid?: string;
}

// ─── Decode ───────────────────────────────────────────────────────────────────

/**
 * Decode a JWT's payload without verifying its signature.
 * Use `verifyJwt()` when signature verification is required.
 */
export function decodeJwtPayload(token: string): JwtPayload {
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

/**
 * Decode a JWT's header without verifying its signature.
 */
export function decodeJwtHeader(token: string): JwtHeader {
	const parts = token.split(".");
	if (parts.length !== 3 || !parts[0]) {
		throw new NexusAuthError("Invalid JWT format");
	}
	try {
		const base64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
		return JSON.parse(atob(padded)) as JwtHeader;
	} catch {
		throw new NexusAuthError("Failed to decode JWT header");
	}
}

// ─── Expiry helpers ───────────────────────────────────────────────────────────

/** Returns true if the token's `exp` claim is within `bufferMs` of expiring. */
export function isExpiringSoon(payload: JwtPayload, bufferMs = 30_000): boolean {
	if (!payload.exp) return false;
	return payload.exp * 1000 - Date.now() < bufferMs;
}

/** Returns true if the token's `exp` claim is in the past. */
export function isExpired(payload: JwtPayload, clockSkewMs = 0): boolean {
	if (!payload.exp) return false;
	return payload.exp * 1000 + clockSkewMs < Date.now();
}

// ─── Verify ───────────────────────────────────────────────────────────────────

/**
 * Options for `verifyJwt()`.
 */
export interface JwtVerifyOptions {
	/**
	 * Secret for HS256 tokens (UTF-8 encoded string or raw bytes).
	 * Provide either `secret` (HS256) or `publicKey` (RS256/ES256), not both.
	 */
	secret?: string | Uint8Array;
	/**
	 * Public key for RS256 or ES256 tokens.
	 * Can be a PEM string (`"-----BEGIN PUBLIC KEY-----..."`)
	 * or a pre-imported `CryptoKey`.
	 * Provide either `secret` (HS256) or `publicKey` (RS256/ES256), not both.
	 */
	publicKey?: CryptoKey | string;
	/**
	 * Expected `aud` claim value(s). If provided, the token's `aud` must
	 * include at least one of these values.
	 */
	audience?: string | string[];
	/**
	 * Expected `iss` claim value. If provided, the token's `iss` must match.
	 */
	issuer?: string;
	/**
	 * Expected `sub` claim value. If provided, the token's `sub` must match.
	 */
	subject?: string;
	/**
	 * Clock skew tolerance in milliseconds. Default: 0.
	 * Allows for minor clock drift between issuer and verifier.
	 */
	clockSkewMs?: number;
	/**
	 * If true, skip expiry (`exp`) and not-before (`nbf`) validation.
	 * Useful for testing only.
	 */
	ignoreExpiration?: boolean;
}

/**
 * Verify a JWT's signature and standard claims using the Web Crypto API.
 *
 * Supported algorithms:
 * - **HS256**: HMAC-SHA256 with a shared secret — use `secret` option
 * - **RS256 / RS512**: RSA-PKCS1-v1_5 with a public key — use `publicKey` option
 * - **ES256 / ES512**: ECDSA with a public key — use `publicKey` option
 *
 * @throws {NexusAuthError} if signature or any claim validation fails.
 * @returns The decoded and validated `JwtPayload`.
 *
 * @example
 * // HS256 (sandbox / shared secret)
 * const payload = await verifyJwt(token, { secret: "my-secret" });
 *
 * @example
 * // RS256 with PEM public key (production IdP)
 * const payload = await verifyJwt(token, { publicKey: pemString });
 *
 * @example
 * // RS256 with a pre-imported CryptoKey (e.g. from JwksClient)
 * const key = await jwksClient.getKey(kid);
 * const payload = await verifyJwt(token, { publicKey: key });
 */
export async function verifyJwt(token: string, options: JwtVerifyOptions): Promise<JwtPayload> {
	const parts = token.split(".");
	if (parts.length !== 3) {
		throw new NexusAuthError("Invalid JWT format: expected 3 dot-separated parts");
	}

	const [rawHeader, rawPayload, rawSignature] = parts as [string, string, string];

	// ── Decode header ─────────────────────────────────────────────────────────
	const header = decodeJwtHeader(token);
	const alg = header.alg;

	if (!["HS256", "RS256", "RS512", "ES256", "ES512"].includes(alg)) {
		throw new NexusAuthError(`Unsupported JWT algorithm: ${alg}`);
	}

	// ── Verify signature ──────────────────────────────────────────────────────
	const signingInput = new TextEncoder().encode(`${rawHeader}.${rawPayload}`);
	const signature = base64urlToBytes(rawSignature);

	if (alg === "HS256") {
		if (!options.secret) {
			throw new NexusAuthError("verifyJwt: `secret` is required for HS256 tokens");
		}
		await _verifyHmac(signingInput, signature, options.secret, "SHA-256");
	} else if (alg === "RS256" || alg === "RS512") {
		if (!options.publicKey) {
			throw new NexusAuthError(`verifyJwt: \`publicKey\` is required for ${alg} tokens`);
		}
		const hashAlg = alg === "RS512" ? "SHA-512" : "SHA-256";
		const key = await _resolvePublicKey(options.publicKey, "RSASSA-PKCS1-v1_5", hashAlg);
		await _verifyRsa(signingInput, signature, key, hashAlg);
	} else if (alg === "ES256" || alg === "ES512") {
		if (!options.publicKey) {
			throw new NexusAuthError(`verifyJwt: \`publicKey\` is required for ${alg} tokens`);
		}
		const hashAlg = alg === "ES512" ? "SHA-512" : "SHA-256";
		const key = await _resolvePublicKey(options.publicKey, "ECDSA", hashAlg);
		await _verifyEcdsa(signingInput, signature, key, hashAlg);
	}

	// ── Decode and validate claims ────────────────────────────────────────────
	const payload = decodeJwtPayload(token);
	const clockSkewMs = options.clockSkewMs ?? 0;
	const nowSec = Math.floor(Date.now() / 1000);
	const skewSec = Math.floor(clockSkewMs / 1000);

	if (!options.ignoreExpiration) {
		if (payload.exp !== undefined && payload.exp + skewSec < nowSec) {
			throw new NexusAuthError(`JWT has expired (exp=${payload.exp}, now=${nowSec})`);
		}
		if (payload.nbf !== undefined && payload.nbf - skewSec > nowSec) {
			throw new NexusAuthError(`JWT is not yet valid (nbf=${payload.nbf}, now=${nowSec})`);
		}
	}

	if (options.issuer !== undefined && payload.iss !== options.issuer) {
		throw new NexusAuthError(
			`JWT issuer mismatch: expected "${options.issuer}", got "${payload.iss ?? "(none)"}"`,
		);
	}

	if (options.subject !== undefined && payload.sub !== options.subject) {
		throw new NexusAuthError(
			`JWT subject mismatch: expected "${options.subject}", got "${payload.sub ?? "(none)"}"`,
		);
	}

	if (options.audience !== undefined) {
		const expected = Array.isArray(options.audience) ? options.audience : [options.audience];
		const actual =
			payload.aud === undefined ? [] : Array.isArray(payload.aud) ? payload.aud : [payload.aud];
		const hasMatch = expected.some((e) => actual.includes(e));
		if (!hasMatch) {
			throw new NexusAuthError(
				`JWT audience mismatch: expected one of [${expected.join(", ")}], got [${actual.join(", ")}]`,
			);
		}
	}

	// Merge kid from header into payload for downstream use (e.g. JWKS key selection)
	if (header.kid) {
		payload.kid = header.kid;
	}

	return payload;
}

// ─── Internal crypto helpers ──────────────────────────────────────────────────

async function _verifyHmac(
	data: Uint8Array,
	signature: Uint8Array,
	secret: string | Uint8Array,
	hash: string,
): Promise<void> {
	const keyData = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
	const key = await crypto.subtle.importKey(
		"raw",
		toBufferSource(keyData),
		{ name: "HMAC", hash },
		false,
		["verify"],
	);
	const valid = await crypto.subtle.verify(
		"HMAC",
		key,
		toBufferSource(signature),
		toBufferSource(data),
	);
	if (!valid) {
		throw new NexusAuthError("JWT signature verification failed (HS256)");
	}
}

async function _verifyRsa(
	data: Uint8Array,
	signature: Uint8Array,
	key: CryptoKey,
	hash: string,
): Promise<void> {
	const valid = await crypto.subtle.verify(
		{ name: "RSASSA-PKCS1-v1_5", hash },
		key,
		toBufferSource(signature),
		toBufferSource(data),
	);
	if (!valid) {
		throw new NexusAuthError("JWT signature verification failed (RSA)");
	}
}

async function _verifyEcdsa(
	data: Uint8Array,
	signature: Uint8Array,
	key: CryptoKey,
	hash: string,
): Promise<void> {
	const valid = await crypto.subtle.verify(
		{ name: "ECDSA", hash },
		key,
		toBufferSource(signature),
		toBufferSource(data),
	);
	if (!valid) {
		throw new NexusAuthError("JWT signature verification failed (ECDSA)");
	}
}

/**
 * Resolve a public key from either a pre-imported CryptoKey or a PEM string.
 */
async function _resolvePublicKey(
	key: CryptoKey | string,
	algorithm: string,
	hash: string,
): Promise<CryptoKey> {
	if (typeof key !== "string") return key;

	// Strip PEM header/footer and decode base64
	const pemBody = key
		.replace(/-----BEGIN [^-]+-----/, "")
		.replace(/-----END [^-]+-----/, "")
		.replace(/\s+/g, "");
	const derBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

	const importAlg =
		algorithm === "ECDSA"
			? { name: "ECDSA", namedCurve: hash === "SHA-512" ? "P-521" : "P-256" }
			: { name: "RSASSA-PKCS1-v1_5", hash };

	return crypto.subtle.importKey("spki", derBytes.buffer as ArrayBuffer, importAlg, false, [
		"verify",
	]);
}

// ─── Base64url helpers ────────────────────────────────────────────────────────

/** @internal */
export function base64urlToBytes(base64url: string): Uint8Array {
	const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
	return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
