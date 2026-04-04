import { describe, expect, test } from "bun:test";
import { NexusAuthError } from "../types/index.ts";
import { JwksClient } from "./jwks-client.ts";

// ─── Mock JWKS server helpers ─────────────────────────────────────────────────

/**
 * Generate an RSA key pair and build a minimal JWKS.
 */
async function makeRsaKeyPair(kid = "test-key") {
	const pair = await crypto.subtle.generateKey(
		{
			name: "RSASSA-PKCS1-v1_5",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		true,
		["sign", "verify"],
	);

	// Export public key as JWK to build the JWKS
	// biome-ignore lint/suspicious/noExplicitAny: exportKey returns JsonWebKey
	const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as any;
	return {
		privateKey: pair.privateKey,
		publicKey: pair.publicKey,
		jwks: {
			keys: [{ ...jwk, kid, use: "sig", alg: "RS256" }],
		},
	};
}

/**
 * Sign a payload as an RS256 JWT.
 */
async function makeRs256Token(
	payload: Record<string, unknown>,
	privateKey: CryptoKey,
	kid?: string,
): Promise<string> {
	const headerObj: Record<string, string> = { alg: "RS256", typ: "JWT" };
	if (kid) headerObj["kid"] = kid;

	const header = btoa(JSON.stringify(headerObj))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
	const payloadB64 = btoa(JSON.stringify(payload))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
	const signingInput = `${header}.${payloadB64}`;
	const sig = await crypto.subtle.sign(
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		privateKey,
		new TextEncoder().encode(signingInput),
	);
	const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
	return `${signingInput}.${signature}`;
}

// ─── JwksClient tests ────────────────────────────────────────────────────────

describe("JwksClient", () => {
	test("fetches and caches JWKS, returns CryptoKey by kid", async () => {
		const { jwks } = await makeRsaKeyPair("key-1");

		const server = Bun.serve({
			port: 0,
			fetch(req) {
				if (new URL(req.url).pathname === "/.well-known/jwks.json") {
					return Response.json(jwks);
				}
				return new Response("Not Found", { status: 404 });
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		const key = await client.getKey("key-1");
		server.stop();

		expect(key).toBeInstanceOf(CryptoKey);
		expect(key.type).toBe("public");
	});

	test("returns first signing key when no kid is specified", async () => {
		const { jwks } = await makeRsaKeyPair("only-key");

		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(jwks);
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		const key = await client.getKey();
		server.stop();

		expect(key).toBeInstanceOf(CryptoKey);
	});

	test("throws NexusAuthError when kid is not found after re-fetch", async () => {
		const { jwks } = await makeRsaKeyPair("key-1");

		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(jwks);
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		await expect(client.getKey("nonexistent-kid")).rejects.toBeInstanceOf(NexusAuthError);
		server.stop();
	});

	test("throws NexusAuthError when JWKS endpoint returns non-200", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return new Response("Unauthorized", { status: 401 });
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		await expect(client.getKey()).rejects.toBeInstanceOf(NexusAuthError);
		server.stop();
	});

	test("throws NexusAuthError for invalid JWKS (missing keys array)", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json({ not_keys: [] });
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		await expect(client.getKey()).rejects.toBeInstanceOf(NexusAuthError);
		server.stop();
	});

	test("can verify an RS256 token end-to-end with JwksClient + verifyJwt", async () => {
		const { jwks, privateKey } = await makeRsaKeyPair("e2e-key");
		const now = Math.floor(Date.now() / 1000);
		const token = await makeRs256Token(
			{
				sub: "alice",
				aud: "https://daml.com/jwt/aud/participant/sandbox",
				exp: now + 3600,
			},
			privateKey,
			"e2e-key",
		);

		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(jwks);
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		const { verifyJwt, decodeJwtHeader } = await import("../utils/jwt.ts");
		const header = decodeJwtHeader(token);
		const key = await client.getKey(header.kid);
		const payload = await verifyJwt(token, {
			publicKey: key,
			audience: "https://daml.com/jwt/aud/participant/sandbox",
		});

		server.stop();
		expect(payload.sub).toBe("alice");
	});

	test("invalidate() forces re-fetch on next getKey()", async () => {
		let fetchCount = 0;
		const { jwks } = await makeRsaKeyPair("key-1");

		const server = Bun.serve({
			port: 0,
			fetch() {
				fetchCount++;
				return Response.json(jwks);
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		await client.getKey("key-1");
		await client.getKey("key-1"); // should use cache
		expect(fetchCount).toBe(1);

		client.invalidate();
		await client.getKey("key-1"); // should re-fetch
		server.stop();

		expect(fetchCount).toBe(2);
	});

	test("preload() eagerly loads keys", async () => {
		let fetchCount = 0;
		const { jwks } = await makeRsaKeyPair("preload-key");

		const server = Bun.serve({
			port: 0,
			fetch() {
				fetchCount++;
				return Response.json(jwks);
			},
		});

		const client = new JwksClient({
			jwksUri: `http://localhost:${server.port}/.well-known/jwks.json`,
		});

		await client.preload();
		expect(fetchCount).toBe(1);

		await client.getKey("preload-key"); // uses cache
		server.stop();

		expect(fetchCount).toBe(1);
	});
});
