import { describe, expect, test } from "bun:test";
import { createNexusClient } from "@nexus-framework/core";
import { withLedgerAction } from "./server-actions.ts";

function makeMockCanton(submitBody: unknown, status = 200) {
	return Bun.serve({
		port: 0,
		fetch() {
			return Response.json(submitBody, { status });
		},
	});
}

describe("withLedgerAction", () => {
	test("returns success result when action resolves", async () => {
		const submitResult = {
			transactionId: "txn-1",
			commandId: "cmd-1",
			offset: "00000001",
			completedAt: "2026-01-01T00:00:05Z",
		};
		const server = makeMockCanton(submitResult);
		const client = createNexusClient({
			ledgerApiUrl: `http://localhost:${server.port}`,
			auth: { type: "sandbox", secret: "s", userId: "alice", partyId: "Alice::abc" },
		});

		const result = await withLedgerAction(client, (c) =>
			c.ledger.commands.createContract("pkg:Mod:T", { owner: "Alice::abc" }, ["Alice::abc"]),
		);
		server.stop();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.transactionId).toBe("txn-1");
		}
	});

	test("returns failure result when action throws NexusError", async () => {
		const server = makeMockCanton({ message: "Rejected" }, 400);
		const client = createNexusClient({
			ledgerApiUrl: `http://localhost:${server.port}`,
			auth: { type: "sandbox", secret: "s", userId: "alice", partyId: "Alice::abc" },
		});

		const result = await withLedgerAction(client, (c) =>
			c.ledger.commands.createContract("pkg:Mod:T", {}, ["Alice::abc"]),
		);
		server.stop();

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeString();
			expect(result.code).toBe("LEDGER_ERROR");
		}
	});

	test("returns failure result for generic errors", async () => {
		const client = createNexusClient({
			ledgerApiUrl: "http://localhost:1", // unreachable
			auth: { type: "sandbox", secret: "s", userId: "alice", partyId: "Alice::abc" },
		});

		const result = await withLedgerAction(client, async () => {
			throw new Error("Network failure");
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe("Network failure");
		}
	});
});
