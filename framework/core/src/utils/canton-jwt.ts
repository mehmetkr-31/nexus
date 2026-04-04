import type { JwtPayload } from "./jwt";

// ─── Canton Token Format Detection ───────────────────────────────────────────

/**
 * The two Canton JWT formats supported by the Ledger API.
 *
 * @see https://docs.digitalasset.com/build/3.4/sdlc-howtos/applications/secure/authorization.html
 */
export type CantonTokenFormat = "audience-based" | "scope-based" | "unknown";

/**
 * The `aud` prefix used by audience-based Canton tokens.
 * Format: `https://daml.com/jwt/aud/participant/<participantId>`
 */
const CANTON_AUD_PREFIX = "https://daml.com/jwt/aud/participant/";

/**
 * Detect whether a decoded JWT payload is an **audience-based** Canton token.
 *
 * Audience-based tokens encode the participant ID in the `aud` field:
 * `"https://daml.com/jwt/aud/participant/<participantId>"`
 *
 * This format is recommended as it is compatible with a wider range of IAMs
 * (e.g. Kubernetes service account tokens).
 */
export function isAudienceBasedToken(payload: JwtPayload): boolean {
	if (!payload.aud) return false;
	const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
	return auds.some((a) => a.startsWith(CANTON_AUD_PREFIX));
}

/**
 * Detect whether a decoded JWT payload is a **scope-based** Canton token.
 *
 * Scope-based tokens carry `scope: "daml_ledger_api"` and optionally
 * set `aud` to the participant node ID directly.
 */
export function isScopeBasedToken(payload: JwtPayload): boolean {
	if (!payload.scope) return false;
	return payload.scope.split(" ").includes("daml_ledger_api");
}

/**
 * Determine the Canton token format for a decoded payload.
 * Returns `"unknown"` if neither format is detected.
 */
export function getCantonTokenFormat(payload: JwtPayload): CantonTokenFormat {
	if (isAudienceBasedToken(payload)) return "audience-based";
	if (isScopeBasedToken(payload)) return "scope-based";
	return "unknown";
}

// ─── Participant ID Extraction ────────────────────────────────────────────────

/**
 * Extract the Canton participant node ID from an **audience-based** token.
 *
 * The participant ID is encoded in the `aud` claim:
 * `"https://daml.com/jwt/aud/participant/<participantId>"`
 *
 * Returns `null` if the token is not audience-based or has no valid audience.
 *
 * @example
 * ```ts
 * const payload = decodeJwtPayload(token);
 * const participantId = getParticipantIdFromToken(payload);
 * // → "sandbox-participant"
 * ```
 */
export function getParticipantIdFromToken(payload: JwtPayload): string | null {
	if (!payload.aud) return null;
	const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
	for (const aud of auds) {
		if (aud.startsWith(CANTON_AUD_PREFIX)) {
			const participantId = aud.slice(CANTON_AUD_PREFIX.length);
			return participantId || null;
		}
	}
	return null;
}

// ─── Canton Rights Extraction ─────────────────────────────────────────────────

/**
 * Rights carried by a Canton JWT, resolved at token-issuance time.
 *
 * Note: In the **User Access Token** model (recommended for production),
 * rights are NOT embedded in the token — they are resolved server-side
 * from the participant node's user registry on each request.
 *
 * Rights embedded directly in the token are supported via the legacy
 * `"https://daml.com/ledger-api"` claim.
 */
export interface CantonTokenRights {
	/** Parties this token allows submitting commands as */
	actAs: string[];
	/** Parties this token allows reading the ledger as */
	readAs: string[];
	/** True if the token grants participant admin rights */
	admin: boolean;
}

/**
 * Extract Canton ledger rights from a decoded JWT payload.
 *
 * Reads from the `"https://daml.com/ledger-api"` claim (legacy format).
 * Returns empty arrays if the claim is absent — this is expected for
 * User Access Tokens where rights are managed server-side.
 */
export function extractCantonRights(payload: JwtPayload): CantonTokenRights {
	const claim = payload["https://daml.com/ledger-api"];
	return {
		actAs: claim?.actAs ?? [],
		readAs: claim?.readAs ?? [],
		admin: claim?.admin ?? false,
	};
}

// ─── Canton Token Summary ────────────────────────────────────────────────────

/**
 * A human-readable summary of a Canton JWT for debugging and logging.
 * Contains no sensitive information — safe to log.
 */
export interface CantonTokenInfo {
	format: CantonTokenFormat;
	/** Canton user ID (`sub` claim) */
	userId: string | null;
	/** Participant node ID (from audience-based tokens) */
	participantId: string | null;
	/** Identity provider ID (`iss` claim) */
	idpId: string | null;
	/** True if the token grants participant admin rights */
	admin: boolean;
	/** `actAs` parties embedded in the token (legacy format; empty for User Access Tokens) */
	actAs: string[];
	/** `readAs` parties embedded in the token */
	readAs: string[];
	/** Seconds until expiry. Negative if expired. `null` if no `exp` claim. */
	expiresInSec: number | null;
}

/**
 * Build a summary object from a decoded Canton JWT payload.
 * Useful for debug logging and displaying auth state.
 *
 * @example
 * ```ts
 * const payload = decodeJwtPayload(token);
 * const info = describeCantonToken(payload);
 * console.log(`[auth] ${info.format} token for user=${info.userId}, exp=${info.expiresInSec}s`);
 * ```
 */
export function describeCantonToken(payload: JwtPayload): CantonTokenInfo {
	const rights = extractCantonRights(payload);
	return {
		format: getCantonTokenFormat(payload),
		userId: payload.sub ?? null,
		participantId: getParticipantIdFromToken(payload),
		idpId: payload.iss ?? null,
		admin: rights.admin,
		actAs: rights.actAs,
		readAs: rights.readAs,
		expiresInSec: payload.exp !== undefined ? payload.exp - Math.floor(Date.now() / 1000) : null,
	};
}
