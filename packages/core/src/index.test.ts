import { describe, expect, test } from "bun:test";
import { createNexus, createNexusClient, jwtAuth, sandboxAuth } from "./index.ts";

// ─── createNexus (plugin-based API) ───────────────────────────────────────────

describe("createNexus — plugin-based factory", () => {
	test("creates a client with all expected namespaces", () => {
		const nexus = createNexus({
			ledgerApiUrl: "http://localhost:7575",
			plugins: [
				sandboxAuth({
					secret: "test-secret",
					userId: "alice",
					partyId: "Alice::abc123",
				}),
			],
		});

		expect(nexus.http).toBeDefined();
		expect(nexus.auth.partyId).toBeDefined();
		expect(nexus.auth.session).toBeDefined();
		expect(nexus.ledger.contracts).toBeDefined();
		expect(nexus.ledger.commands).toBeDefined();
		expect(nexus.ledger.identity).toBeDefined();
		expect(typeof nexus.getToken).toBe("function");
	});

	test("getToken() returns a JWT string with sandboxAuth", async () => {
		const nexus = createNexus({
			ledgerApiUrl: "http://localhost:7575",
			plugins: [
				sandboxAuth({
					secret: "test-secret",
					userId: "alice",
					partyId: "Alice::abc123",
				}),
			],
		});

		const token = await nexus.getToken();
		expect(token).toBeString();
		expect(token.split(".")).toHaveLength(3);
	});

	test("getToken() with jwtAuth returns static token", async () => {
		const staticToken = "header.payload.sig";
		const nexus = createNexus({
			ledgerApiUrl: "http://localhost:7575",
			plugins: [jwtAuth({ token: staticToken })],
		});

		const token = await nexus.getToken();
		expect(token).toBe(staticToken);
	});

	test("throws when no auth plugin is provided", () => {
		expect(() =>
			createNexus({
				ledgerApiUrl: "http://localhost:7575",
				plugins: [],
			}),
		).toThrow("at least one plugin must provide authentication");
	});
});

// ─── createNexusClient (legacy compat shim) ────────────────────────────────────

describe("createNexusClient — legacy compat", () => {
	test("still works with sandbox auth config", () => {
		const nexus = createNexusClient({
			ledgerApiUrl: "http://localhost:7575",
			auth: {
				type: "sandbox",
				secret: "test-secret",
				userId: "alice",
				partyId: "Alice::abc123",
			},
		});

		expect(nexus.http).toBeDefined();
		expect(nexus.ledger.contracts).toBeDefined();
		expect(typeof nexus.getToken).toBe("function");
	});

	test("still works with static JWT config", async () => {
		const staticToken = "header.payload.sig";
		const nexus = createNexusClient({
			ledgerApiUrl: "http://localhost:7575",
			auth: { type: "jwt", token: staticToken },
		});

		const token = await nexus.getToken();
		expect(token).toBe(staticToken);
	});
});
