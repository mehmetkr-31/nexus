import { NexusAuthError, type NexusSession } from "../types/index.ts";

const SESSION_COOKIE_NAME = "nexus_session";
const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

interface SessionManagerOptions {
	/** Cookie name. Default: "nexus_session" */
	cookieName?: string;
	/** Session TTL in ms. Default: 1 hour */
	ttlMs?: number;
	/** Set Secure flag on cookie. Default: true in production */
	secure?: boolean;
	/** Cookie domain */
	domain?: string;
	/** Cookie path. Default: "/" */
	path?: string;
	/** Encryption key for session payload (32-byte hex string) */
	encryptionKey?: string;
}

// ─── SessionManager ──────────────────────────────────────────────────────────

export class SessionManager {
	private readonly cookieName: string;
	private readonly ttlMs: number;
	private readonly secure: boolean;
	private readonly domain?: string;
	private readonly path: string;
	private readonly encryptionKey?: string;

	constructor(options: SessionManagerOptions = {}) {
		this.cookieName = options.cookieName ?? SESSION_COOKIE_NAME;
		this.ttlMs = options.ttlMs ?? DEFAULT_SESSION_TTL_MS;
		this.secure = options.secure ?? process.env.NODE_ENV === "production";
		this.domain = options.domain;
		this.path = options.path ?? "/";
		this.encryptionKey = options.encryptionKey;
	}

	// ─── Create ────────────────────────────────────────────────────────────────

	/**
	 * Serialize a session into an HttpOnly Set-Cookie header value.
	 * Call this in your API route/server action after successful auth.
	 */
	async createSessionCookie(session: Omit<NexusSession, "expiresAt">): Promise<string> {
		const expiresAt = Date.now() + this.ttlMs;
		const fullSession: NexusSession = { ...session, expiresAt };
		const payload = await this.serializeSession(fullSession);

		const parts = [
			`${this.cookieName}=${payload}`,
			`Path=${this.path}`,
			`HttpOnly`,
			`SameSite=Lax`,
			`Expires=${new Date(expiresAt).toUTCString()}`,
		];
		if (this.secure) parts.push("Secure");
		if (this.domain) parts.push(`Domain=${this.domain}`);

		return parts.join("; ");
	}

	/**
	 * Parse and validate the session from a Cookie header string.
	 * Returns null if no valid session cookie is present.
	 */
	async getSession(cookieHeader: string | null | undefined): Promise<NexusSession | null> {
		if (!cookieHeader) return null;

		const value = parseCookie(cookieHeader, this.cookieName);
		if (!value) return null;

		try {
			const session = await this.deserializeSession(value);
			if (session.expiresAt < Date.now()) {
				return null; // expired
			}
			return session;
		} catch {
			return null;
		}
	}

	/**
	 * Produce a Set-Cookie header that clears the session cookie.
	 */
	destroySessionCookie(): string {
		return [
			`${this.cookieName}=`,
			`Path=${this.path}`,
			`HttpOnly`,
			`SameSite=Lax`,
			`Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
			...(this.secure ? ["Secure"] : []),
			...(this.domain ? [`Domain=${this.domain}`] : []),
		].join("; ");
	}

	/**
	 * Helper: extract session from a standard `Request` object (Next.js / Bun).
	 */
	async getSessionFromRequest(req: Request): Promise<NexusSession | null> {
		const cookieHeader = req.headers.get("cookie");
		return this.getSession(cookieHeader);
	}

	/**
	 * Helper: extract session and throw if not found (useful in Server Actions).
	 */
	async requireSession(req: Request): Promise<NexusSession> {
		const session = await this.getSessionFromRequest(req);
		if (!session) {
			throw new NexusAuthError("No valid session found. Please authenticate.");
		}
		return session;
	}

	// ─── Serialization ─────────────────────────────────────────────────────────

	private async serializeSession(session: NexusSession): Promise<string> {
		const json = JSON.stringify(session);
		if (this.encryptionKey) {
			return this.encrypt(json, this.encryptionKey);
		}
		// Base64-encode without encryption (not recommended for production)
		return btoa(json).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	}

	private async deserializeSession(value: string): Promise<NexusSession> {
		let json: string;
		if (this.encryptionKey) {
			json = await this.decrypt(value, this.encryptionKey);
		} else {
			const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
			const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
			json = atob(padded);
		}
		return JSON.parse(json) as NexusSession;
	}

	// ─── AES-GCM Encryption ────────────────────────────────────────────────────

	private async encrypt(plaintext: string, keyHex: string): Promise<string> {
		const keyBytes = hexToBytes(keyHex);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const key = await crypto.subtle.importKey(
			"raw",
			keyBytes.buffer as ArrayBuffer,
			{ name: "AES-GCM" },
			false,
			["encrypt"],
		);
		const ciphertext = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			key,
			new TextEncoder().encode(plaintext),
		);
		// Prepend IV to ciphertext
		const combined = new Uint8Array(iv.length + ciphertext.byteLength);
		combined.set(iv);
		combined.set(new Uint8Array(ciphertext), iv.length);
		return btoa(String.fromCharCode(...combined))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
	}

	private async decrypt(encoded: string, keyHex: string): Promise<string> {
		const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
		const combined = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
		const iv = combined.slice(0, 12);
		const ciphertext = combined.slice(12);

		const keyBytes = hexToBytes(keyHex);
		const key = await crypto.subtle.importKey(
			"raw",
			keyBytes.buffer as ArrayBuffer,
			{ name: "AES-GCM" },
			false,
			["decrypt"],
		);
		const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
		return new TextDecoder().decode(plaintext);
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCookie(header: string, name: string): string | undefined {
	for (const part of header.split(";")) {
		const [k, ...v] = part.trim().split("=");
		if (k?.trim() === name) {
			return v.join("=").trim();
		}
	}
	return undefined;
}

function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) {
		throw new NexusAuthError("Encryption key must be a valid hex string");
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}

/** Generate a random 32-byte AES key as a hex string (for setup/documentation) */
export function generateEncryptionKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
