import { describe, expect, test } from "bun:test";
import { createNexusClient } from "./index.ts";

describe("createNexusClient — factory", () => {
	test("creates a client with all expected namespaces", () => {
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
		expect(nexus.auth.jwt).toBeDefined();
		expect(nexus.auth.partyId).toBeDefined();
		expect(nexus.auth.session).toBeDefined();
		expect(nexus.ledger.contracts).toBeDefined();
		expect(nexus.ledger.commands).toBeDefined();
		expect(nexus.ledger.identity).toBeDefined();
		expect(typeof nexus.getToken).toBe("function");
	});

	test("getToken() returns a JWT string", async () => {
		const nexus = createNexusClient({
			ledgerApiUrl: "http://localhost:7575",
			auth: {
				type: "sandbox",
				secret: "test-secret",
				userId: "alice",
				partyId: "Alice::abc123",
			},
		});

		const token = await nexus.getToken();
		expect(token).toBeString();
		expect(token.split(".")).toHaveLength(3);
	});

	test("static JWT auth passes token through", async () => {
		const staticToken = "header.payload.sig";
		const nexus = createNexusClient({
			ledgerApiUrl: "http://localhost:7575",
			auth: { type: "jwt", token: staticToken },
		});

		const token = await nexus.getToken();
		expect(token).toBe(staticToken);
	});
});
