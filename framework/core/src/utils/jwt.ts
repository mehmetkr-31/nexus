import { NexusAuthError } from "../types/index";

export interface JwtPayload {
	sub?: string;
	exp?: number;
	nbf?: number;
	iat?: number;
	aud?: string | string[];
	scope?: string;
	"https://daml.com/ledger-api"?: {
		actAs: string[];
		readAs: string[];
		admin?: boolean;
	};
}

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

export function isExpiringSoon(payload: JwtPayload, bufferMs = 30_000): boolean {
	if (!payload.exp) return false;
	return payload.exp * 1000 - Date.now() < bufferMs;
}
