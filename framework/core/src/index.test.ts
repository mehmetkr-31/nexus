import { describe, expect, test } from "bun:test";
import { createNexus, jwtAuth, sandboxAuth } from "./index.ts";

describe("createNexus", () => {
	test("creates a client with all expected namespaces", async () => {
		const nexus = await createNexus({
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
		expect(nexus.ledger.contracts).toBeDefined();
		expect(typeof nexus.getToken).toBe("function");
	});

	test("still works with sandbox auth config", async () => {
		const nexus = await createNexus({
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
		expect(nexus.ledger.contracts).toBeDefined();
		expect(typeof nexus.getToken).toBe("function");
	});

	test("still works with static JWT config", async () => {
		const staticToken = "header.payload.sig";
		const nexus = await createNexus({
			ledgerApiUrl: "http://localhost:7575",
			plugins: [jwtAuth({ token: staticToken })],
		});

		const token = await nexus.getToken();
		expect(token).toBe(staticToken);
	});
});
