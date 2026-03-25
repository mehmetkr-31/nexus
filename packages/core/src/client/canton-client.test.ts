import { describe, expect, test } from "bun:test";
import { NexusLedgerError } from "../types/index.ts";
import { CantonClient } from "./canton-client.ts";

// ─── Mock Canton Server ───────────────────────────────────────────────────────

function makeMockServer(handlers: Record<string, { status?: number; body: unknown }>) {
	return Bun.serve({
		port: 0,
		fetch(req) {
			const path = new URL(req.url).pathname;
			const handler = handlers[path];
			if (!handler) return new Response("Not Found", { status: 404 });
			return Response.json(handler.body, { status: handler.status ?? 200 });
		},
	});
}

const mockContractsResponse = {
	contracts: [
		{
			contractId: "contract-1",
			templateId: {
				packageId: "pkg-abc",
				moduleName: "My.Module",
				entityName: "MyContract",
			},
			payload: { owner: "Alice::abc", value: 42 },
			createdAt: "2026-01-01T00:00:00Z",
			signatories: ["Alice::abc"],
			observers: [],
		},
	],
	nextPageToken: undefined,
};

const mockSubmitResult = {
	transactionId: "txn-123",
	commandId: "cmd-456",
	offset: "0000000000000001",
	completedAt: "2026-01-01T00:00:05Z",
};

const mockLedgerEnd = { offset: "0000000000000042" };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CantonClient — queryContracts", () => {
	test("returns parsed contracts on 200", async () => {
		const server = makeMockServer({
			"/v2/state/active-contracts": { body: mockContractsResponse },
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		const result = await client.queryContracts("pkg-abc:My.Module:MyContract");
		server.stop();

		expect(result.contracts).toHaveLength(1);
		expect(result.contracts[0]?.contractId).toBe("contract-1");
		expect(result.contracts[0]?.payload).toEqual({ owner: "Alice::abc", value: 42 });
	});

	test("throws NexusLedgerError on non-200 response", async () => {
		const server = makeMockServer({
			"/v2/state/active-contracts": {
				status: 403,
				body: { message: "Forbidden" },
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		await expect(client.queryContracts("pkg-abc:My.Module:MyContract")).rejects.toBeInstanceOf(
			NexusLedgerError,
		);
		server.stop();
	});

	test("sends Authorization header with Bearer token", async () => {
		let receivedAuth: string | null = null;
		const server = Bun.serve({
			port: 0,
			fetch(req) {
				receivedAuth = req.headers.get("authorization");
				return Response.json(mockContractsResponse);
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "my-secret-token",
		});

		await client.queryContracts("pkg:Mod:Entity");
		server.stop();

		expect(receivedAuth ?? "").toBe("Bearer my-secret-token");
	});
});

describe("CantonClient — submitAndWait", () => {
	test("returns SubmitResult on success", async () => {
		const server = makeMockServer({
			"/v2/commands/submit-and-wait": { body: mockSubmitResult },
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		const result = await client.submitAndWait({
			commands: [
				{
					type: "create",
					templateId: "pkg:Mod:MyContract",
					createArguments: { owner: "Alice::abc" },
				},
			],
			actAs: ["Alice::abc"],
		});
		server.stop();

		expect(result.transactionId).toBe("txn-123");
		expect(result.offset).toBe("0000000000000001");
	});

	test("throws NexusLedgerError on command rejection (400)", async () => {
		const server = makeMockServer({
			"/v2/commands/submit-and-wait": {
				status: 400,
				body: { message: "Invalid command" },
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		await expect(
			client.submitAndWait({
				commands: [{ type: "create", templateId: "pkg:Mod:T", createArguments: {} }],
				actAs: ["Alice::abc"],
			}),
		).rejects.toBeInstanceOf(NexusLedgerError);
		server.stop();
	});
});

describe("CantonClient — getLedgerEnd", () => {
	test("returns ledger end offset", async () => {
		const server = makeMockServer({
			"/v2/state/ledger-end": { body: mockLedgerEnd },
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		const end = await client.getLedgerEnd();
		server.stop();

		expect(end.offset).toBe("0000000000000042");
	});
});

describe("CantonClient — timeout", () => {
	test("throws on timeout", async () => {
		const server = Bun.serve({
			port: 0,
			async fetch() {
				await new Promise((r) => setTimeout(r, 500));
				return Response.json({});
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
			timeoutMs: 50,
		});

		await expect(client.getLedgerEnd()).rejects.toThrow();
		server.stop();
	});
});
