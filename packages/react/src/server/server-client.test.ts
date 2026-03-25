import { describe, expect, test } from "bun:test";
import { generateEncryptionKey, NexusAuthError, SessionManager } from "@nexus-framework/core";
import { createServerNexusClient, createServerNexusClientFromSession } from "./server-client.ts";

describe("createServerNexusClientFromSession", () => {
	test("creates a client from a valid session", () => {
		const client = createServerNexusClientFromSession(
			{ token: "test.token.sig", partyId: "Alice::abc", expiresAt: Date.now() + 3600_000 },
			"http://localhost:7575",
		);
		expect(client).toBeDefined();
		expect(typeof client.getToken).toBe("function");
	});

	test("client getToken() returns the session token", async () => {
		const client = createServerNexusClientFromSession(
			{ token: "my.jwt.token", partyId: "Alice::abc", expiresAt: Date.now() + 3600_000 },
			"http://localhost:7575",
		);
		const token = await client.getToken();
		expect(token).toBe("my.jwt.token");
	});
});

describe("createServerNexusClient", () => {
	test("throws NexusAuthError when no session cookie present", async () => {
		const req = new Request("http://localhost/");
		await expect(
			createServerNexusClient({
				request: req,
				config: { ledgerApiUrl: "http://localhost:7575" },
			}),
		).rejects.toBeInstanceOf(NexusAuthError);
	});

	test("creates client from encrypted session cookie", async () => {
		const key = generateEncryptionKey();
		const mgr = new SessionManager({ encryptionKey: key, secure: false });
		const cookieHeader = await mgr.createSessionCookie({
			token: "server.jwt.token",
			partyId: "Alice::abc",
			userId: "alice",
		});

		const cookieName = cookieHeader.split("=")[0]!;
		const cookieValue = cookieHeader.split(";")[0]?.slice(cookieName.length + 1);

		const req = new Request("http://localhost/api/data", {
			headers: { cookie: `${cookieName}=${cookieValue}` },
		});

		const client = await createServerNexusClient({
			request: req,
			config: {
				ledgerApiUrl: "http://localhost:7575",
				sessionEncryptionKey: key,
			},
		});

		const token = await client.getToken();
		expect(token).toBe("server.jwt.token");
	});
});
