import { describe, expect, test } from "bun:test";
import { NexusAuthError } from "../types/index.ts";
import {
	base64urlToBytes,
	decodeJwtHeader,
	decodeJwtPayload,
	isExpired,
	isExpiringSoon,
	type JwtPayload,
	verifyJwt,
} from "./jwt.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal HS256-signed JWT using the Web Crypto API (same as JwtManager).
 */
async function makeHs256Token(payload: JwtPayload, secret = "test-secret"): Promise<string> {
	const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	const payloadB64 = btoa(JSON.stringify(payload))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	const signingInput = `${header}.${payloadB64}`;
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

const now = Math.floor(Date.now() / 1000);

// ─── decodeJwtPayload ─────────────────────────────────────────────────────────

describe("decodeJwtPayload", () => {
	test("decodes a valid JWT payload", async () => {
		const token = await makeHs256Token({ sub: "alice", exp: now + 3600 });
		const payload = decodeJwtPayload(token);
		expect(payload.sub).toBe("alice");
		expect(payload.exp).toBe(now + 3600);
	});

	test("throws NexusAuthError for malformed token", () => {
		expect(() => decodeJwtPayload("not.a.jwt.with.too.many.parts")).toThrow(NexusAuthError);
		expect(() => decodeJwtPayload("onlyone")).toThrow(NexusAuthError);
	});

	test("decodes iss field", async () => {
		const token = await makeHs256Token({ sub: "bob", iss: "my-idp" });
		const payload = decodeJwtPayload(token);
		expect(payload.iss).toBe("my-idp");
	});
});

// ─── decodeJwtHeader ─────────────────────────────────────────────────────────

describe("decodeJwtHeader", () => {
	test("decodes alg and typ", async () => {
		const token = await makeHs256Token({ sub: "alice" });
		const header = decodeJwtHeader(token);
		expect(header.alg).toBe("HS256");
		expect(header.typ).toBe("JWT");
	});

	test("decodes kid when present", async () => {
		// Build a token with a custom header kid
		const headerObj = { alg: "HS256", typ: "JWT", kid: "key-2025" };
		const headerB64 = btoa(JSON.stringify(headerObj))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const payloadB64 = btoa(JSON.stringify({ sub: "x" }))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const token = `${headerB64}.${payloadB64}.fakesig`;
		const header = decodeJwtHeader(token);
		expect(header.kid).toBe("key-2025");
	});
});

// ─── isExpiringSoon / isExpired ───────────────────────────────────────────────

describe("isExpiringSoon", () => {
	test("returns false for a token expiring in 1 hour", () => {
		expect(isExpiringSoon({ exp: now + 3600 })).toBe(false);
	});

	test("returns true for a token expiring in 10 seconds", () => {
		expect(isExpiringSoon({ exp: now + 10 })).toBe(true);
	});

	test("returns false when no exp claim", () => {
		expect(isExpiringSoon({})).toBe(false);
	});
});

describe("isExpired", () => {
	test("returns false for a future token", () => {
		expect(isExpired({ exp: now + 3600 })).toBe(false);
	});

	test("returns true for a past token", () => {
		expect(isExpired({ exp: now - 1 })).toBe(true);
	});

	test("returns false when no exp claim", () => {
		expect(isExpired({})).toBe(false);
	});
});

// ─── verifyJwt ────────────────────────────────────────────────────────────────

describe("verifyJwt — HS256", () => {
	test("verifies a valid HS256 token", async () => {
		const token = await makeHs256Token({ sub: "alice", exp: now + 3600 }, "secret");
		const payload = await verifyJwt(token, { secret: "secret" });
		expect(payload.sub).toBe("alice");
	});

	test("throws NexusAuthError for wrong secret", async () => {
		const token = await makeHs256Token({ sub: "alice", exp: now + 3600 }, "secret");
		await expect(verifyJwt(token, { secret: "wrong-secret" })).rejects.toBeInstanceOf(
			NexusAuthError,
		);
	});

	test("throws NexusAuthError for expired token", async () => {
		const token = await makeHs256Token({ sub: "alice", exp: now - 10 }, "secret");
		await expect(verifyJwt(token, { secret: "secret" })).rejects.toBeInstanceOf(NexusAuthError);
	});

	test("skips expiry check with ignoreExpiration: true", async () => {
		const token = await makeHs256Token({ sub: "alice", exp: now - 10 }, "secret");
		const payload = await verifyJwt(token, { secret: "secret", ignoreExpiration: true });
		expect(payload.sub).toBe("alice");
	});

	test("validates iss claim", async () => {
		const token = await makeHs256Token({ sub: "alice", iss: "my-idp", exp: now + 3600 }, "secret");
		const payload = await verifyJwt(token, { secret: "secret", issuer: "my-idp" });
		expect(payload.iss).toBe("my-idp");

		await expect(
			verifyJwt(token, { secret: "secret", issuer: "wrong-idp" }),
		).rejects.toBeInstanceOf(NexusAuthError);
	});

	test("validates sub claim", async () => {
		const token = await makeHs256Token({ sub: "alice", exp: now + 3600 }, "secret");
		await expect(verifyJwt(token, { secret: "secret", subject: "bob" })).rejects.toBeInstanceOf(
			NexusAuthError,
		);
	});

	test("validates aud claim — string audience", async () => {
		const token = await makeHs256Token(
			{
				sub: "alice",
				aud: "https://daml.com/jwt/aud/participant/sandbox",
				exp: now + 3600,
			},
			"secret",
		);
		const payload = await verifyJwt(token, {
			secret: "secret",
			audience: "https://daml.com/jwt/aud/participant/sandbox",
		});
		expect(payload.aud).toBe("https://daml.com/jwt/aud/participant/sandbox");

		await expect(
			verifyJwt(token, {
				secret: "secret",
				audience: "https://daml.com/jwt/aud/participant/other",
			}),
		).rejects.toBeInstanceOf(NexusAuthError);
	});

	test("validates aud claim — array audience", async () => {
		const token = await makeHs256Token(
			{
				sub: "alice",
				aud: ["aud1", "aud2"],
				exp: now + 3600,
			},
			"secret",
		);
		const payload = await verifyJwt(token, { secret: "secret", audience: "aud2" });
		expect(Array.isArray(payload.aud)).toBe(true);
	});

	test("respects clockSkewMs for slightly expired token", async () => {
		// Expired 5 seconds ago, but clockSkew of 10s allows it
		const token = await makeHs256Token({ sub: "alice", exp: now - 5 }, "secret");
		const payload = await verifyJwt(token, { secret: "secret", clockSkewMs: 10_000 });
		expect(payload.sub).toBe("alice");
	});

	test("validates nbf claim", async () => {
		// nbf 60 seconds in the future
		const token = await makeHs256Token({ sub: "alice", nbf: now + 60, exp: now + 3600 }, "secret");
		await expect(verifyJwt(token, { secret: "secret" })).rejects.toBeInstanceOf(NexusAuthError);
	});

	test("merges kid from header into returned payload", async () => {
		// Build token with kid in header
		const headerObj = { alg: "HS256", typ: "JWT", kid: "my-key-id" };
		const headerB64 = btoa(JSON.stringify(headerObj))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const payloadObj: JwtPayload = { sub: "alice", exp: now + 3600 };
		const payloadB64 = btoa(JSON.stringify(payloadObj))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const signingInput = `${headerB64}.${payloadB64}`;
		const keyData = new TextEncoder().encode("secret");
		const key = await crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
		const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const token = `${signingInput}.${signature}`;

		const payload = await verifyJwt(token, { secret: "secret" });
		expect(payload.kid).toBe("my-key-id");
	});

	test("throws for unsupported algorithm", async () => {
		// Fake a token with alg: none
		const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const payload = btoa(JSON.stringify({ sub: "x" }))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const token = `${header}.${payload}.fakesig`;
		await expect(verifyJwt(token, { secret: "secret" })).rejects.toBeInstanceOf(NexusAuthError);
	});
});

// ─── base64urlToBytes ─────────────────────────────────────────────────────────

describe("base64urlToBytes", () => {
	test("decodes base64url without padding", () => {
		// "hello" in base64 = "aGVsbG8="
		// base64url (no padding) = "aGVsbG8"
		const bytes = base64urlToBytes("aGVsbG8");
		expect(new TextDecoder().decode(bytes)).toBe("hello");
	});

	test("handles base64url with - and _ characters", () => {
		// Some edge case bytes
		const original = new Uint8Array([0xfb, 0xff, 0xfe]);
		const b64url = btoa(String.fromCharCode(...original))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
		const decoded = base64urlToBytes(b64url);
		expect(decoded).toEqual(original);
	});
});
