import { describe, expect, test } from "bun:test";
import { NexusLedgerError } from "../types/index.ts";
import type { FetchMiddleware, RequestConfig } from "../types/plugin.ts";
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
			"/v2/state/active-contracts": { body: mockContractsResponse.contracts },
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
				return Response.json(mockContractsResponse.contracts);
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

describe("CantonClient — submitAndWaitForTransaction", () => {
	const mockTxResult = {
		transactionId: "txn-789",
		commandId: "cmd-101",
		offset: 42,
		completedAt: "2026-01-01T00:00:10Z",
		events: [
			{
				type: "exercised",
				event: {
					nodeId: 0,
					offset: 42,
					contractId: "contract-1",
					templateId: { packageId: "pkg", moduleName: "Mod", entityName: "T" },
					choice: "Archive",
					choiceArgument: {},
					actingParties: ["Alice::abc"],
					consuming: true,
					witnessParties: ["Alice::abc"],
					exerciseResult: { newContractId: "contract-2" },
					childNodeIds: [],
					packageName: "my-package",
				},
			},
		],
	};

	test("returns TransactionResult on success", async () => {
		const server = makeMockServer({
			"/v2/commands/submit-and-wait-for-transaction": { body: mockTxResult },
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		const result = await client.submitAndWaitForTransaction({
			commands: [
				{
					type: "exercise",
					templateId: "pkg:Mod:T",
					contractId: "contract-1",
					choice: "Archive",
					choiceArgument: {},
				},
			],
			actAs: ["Alice::abc"],
		});
		server.stop();

		expect(result.transactionId).toBe("txn-789");
		expect(result.offset).toBe(42);
		expect(result.events).toHaveLength(1);
	});

	test("throws NexusLedgerError on command rejection", async () => {
		const server = makeMockServer({
			"/v2/commands/submit-and-wait-for-transaction": {
				status: 400,
				body: { message: "Contract not found" },
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		await expect(
			client.submitAndWaitForTransaction({
				commands: [
					{
						type: "exercise",
						templateId: "pkg:Mod:T",
						contractId: "bad-id",
						choice: "Archive",
						choiceArgument: {},
					},
				],
				actAs: ["Alice::abc"],
			}),
		).rejects.toBeInstanceOf(NexusLedgerError);
		server.stop();
	});
});

describe("CantonClient — queryByInterface", () => {
	const mockInterfaceResponse = {
		interfaces: [
			{
				contractId: "contract-1",
				templateId: { packageId: "pkg", moduleName: "Mod", entityName: "T" },
				payload: { owner: "Alice::abc" },
				interfaceId: "pkg:Iface:IAsset",
				interfaceView: { assetName: "Gold", amount: 100 },
				signatories: ["Alice::abc"],
				observers: [],
				createdAt: "2026-01-01T00:00:00Z",
			},
		],
		nextPageToken: undefined,
	};

	test("returns interface contracts with view data", async () => {
		let _receivedBody: unknown;
		const server = Bun.serve({
			port: 0,
			async fetch(req) {
				_receivedBody = await req.json();
				return Response.json(mockInterfaceResponse.interfaces);
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		const result = await client.queryByInterface<{ assetName: string; amount: number }>(
			"pkg:Iface:IAsset",
			{ parties: ["Alice::abc"] },
		);
		server.stop();

		expect(result.interfaces).toHaveLength(1);
		expect(result.interfaces[0]?.interfaceId).toBe("pkg:Iface:IAsset");
		expect(result.interfaces[0]?.interfaceView.assetName).toBe("Gold");
		expect(result.interfaces[0]?.interfaceView.amount).toBe(100);
	});

	test("sends interfaceFilters with includeInterfaceView: true", async () => {
		let receivedBody: Record<string, unknown> = {};
		const server = Bun.serve({
			port: 0,
			async fetch(req) {
				receivedBody = (await req.json()) as Record<string, unknown>;
				return Response.json([]);
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		await client.queryByInterface("pkg:Iface:IAsset");
		server.stop();

		const filter = (receivedBody.filter as Record<string, unknown>) ?? {};
		const interfaceFilters = filter.interfaceFilters as Array<Record<string, unknown>>;
		expect(interfaceFilters).toHaveLength(1);
		expect(interfaceFilters[0]?.interfaceId).toBe("pkg:Iface:IAsset");
		expect(interfaceFilters[0]?.includeInterfaceView).toBe(true);
	});

	test("throws NexusLedgerError on 403", async () => {
		const server = makeMockServer({
			"/v2/state/active-contracts": { status: 403, body: { message: "Forbidden" } },
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
		});

		await expect(client.queryByInterface("pkg:Iface:IAsset")).rejects.toBeInstanceOf(
			NexusLedgerError,
		);
		server.stop();
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

// ─── Fetch Middleware Tests ───────────────────────────────────────────────────

describe("CantonClient — fetch middleware", () => {
	test("onRequest hook can add custom headers", async () => {
		let receivedHeaders: Record<string, string> = {};
		const server = Bun.serve({
			port: 0,
			fetch(req) {
				receivedHeaders = Object.fromEntries(req.headers.entries());
				return Response.json({ offset: "1" });
			},
		});

		const middleware: FetchMiddleware = {
			onRequest: (config) => ({
				...config,
				headers: { ...config.headers, "X-Custom": "hello" },
			}),
		};

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
			middlewares: [middleware],
		});

		await client.getLedgerEnd();
		server.stop();

		expect(receivedHeaders["x-custom"]).toBe("hello");
	});

	test("onResponse hook is called on success", async () => {
		const server = makeMockServer({
			"/v2/state/ledger-end": { body: { offset: "42" } },
		});

		let capturedConfig: RequestConfig | undefined;
		const middleware: FetchMiddleware = {
			onResponse: async (_response, config) => {
				capturedConfig = config;
			},
		};

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
			middlewares: [middleware],
		});

		await client.getLedgerEnd();
		server.stop();

		expect(capturedConfig).toBeDefined();
		expect(capturedConfig?.method).toBe("GET");
		expect(capturedConfig?.path).toBe("/v2/state/ledger-end");
	});

	test("onError hook is called on HTTP error", async () => {
		const server = makeMockServer({
			"/v2/state/ledger-end": { status: 500, body: { message: "Internal" } },
		});

		let capturedError: NexusLedgerError | undefined;
		const middleware: FetchMiddleware = {
			onError: async (error) => {
				capturedError = error;
			},
		};

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
			middlewares: [middleware],
		});

		await expect(client.getLedgerEnd()).rejects.toBeInstanceOf(NexusLedgerError);
		server.stop();

		expect(capturedError).toBeInstanceOf(NexusLedgerError);
	});

	test("multiple middlewares run in order", async () => {
		const order: string[] = [];
		const server = makeMockServer({
			"/v2/state/ledger-end": { body: { offset: "1" } },
		});

		const mw1: FetchMiddleware = {
			onRequest: (config) => {
				order.push("mw1-request");
				return config;
			},
			onResponse: async () => {
				order.push("mw1-response");
			},
		};
		const mw2: FetchMiddleware = {
			onRequest: (config) => {
				order.push("mw2-request");
				return config;
			},
			onResponse: async () => {
				order.push("mw2-response");
			},
		};

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "test-token",
			middlewares: [mw1, mw2],
		});

		await client.getLedgerEnd();
		server.stop();

		expect(order).toEqual(["mw1-request", "mw2-request", "mw1-response", "mw2-response"]);
	});
});
