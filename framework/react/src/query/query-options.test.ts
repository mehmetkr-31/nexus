import { describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { createNexusClient } from "../create-nexus-client.ts";
import { tanstackQueryPlugin } from "../plugins/tanstack-query.ts";
import { nexusKeys } from "./query-keys.ts";

function makeMockServer(handlers: Record<string, unknown>) {
	return Bun.serve({
		port: 0,
		async fetch(req) {
			const path = new URL(req.url).pathname;
			const handler = handlers[path];
			if (!handler) return new Response("Not Found", { status: 404 });
			return Response.json(handler);
		},
	});
}

const mockContracts = [
	{
		contractId: "c1",
		templateId: { packageId: "pkg", moduleName: "Mod", entityName: "Iou" },
		payload: { amount: 100 },
		createdAt: "2026-01-01T00:00:00Z",
		signatories: ["Alice::abc"],
		observers: [],
	},
];

describe("contractQueryOptions", () => {
	test("queryKey matches nexusKeys.contractsQuery structure", async () => {
		const server = Bun.serve({ port: 0, fetch: () => Response.json({}) });
		const client = await createNexusClient({
			baseUrl: `http://localhost:${server.port}`,
			plugins: [
				{
					id: "mock-auth",
					auth: { getToken: async () => "token" },
				},
				tanstackQueryPlugin(),
			],
		});
		server.stop();

		if (!client.query) throw new Error("query undefined");
		const opts = client.query.contracts({
			templateId: "pkg:Mod:Iou",
			parties: ["Alice::abc"],
		});

		const expected = nexusKeys.contractsQuery("pkg:Mod:Iou", { parties: ["Alice::abc"] });
		expect(Array.from(opts.queryKey)).toEqual(Array.from(expected));
	});

	test("queryFn fetches and returns contracts via QueryClient", async () => {
		const server = makeMockServer({
			"/v2/state/active-contracts": mockContracts,
		});

		const client = await createNexusClient({
			baseUrl: `http://localhost:${server.port}`,
			plugins: [
				{
					id: "mock-auth",
					auth: { getToken: async () => "token" },
				},
				tanstackQueryPlugin(),
			],
		});

		const qc = new QueryClient();
		if (!client.query) throw new Error("query undefined");
		const opts = client.query.contracts({ templateId: "pkg:Mod:Iou" });
		const result = await qc.fetchQuery(opts);
		server.stop();

		expect(result.contracts).toHaveLength(1);
		expect(result.contracts[0]?.contractId).toBe("c1");
	});
});

describe("ledgerEndQueryOptions", () => {
	test("queryKey matches nexusKeys.ledgerEnd() structure", async () => {
		const client = await createNexusClient({
			baseUrl: "http://localhost:7575",
			plugins: [
				{
					id: "mock-auth",
					auth: { getToken: async () => "token" },
				},
				tanstackQueryPlugin(),
			],
		});

		if (!client.query) throw new Error("query undefined");
		const opts = client.query.ledgerEnd();
		expect(Array.from(opts.queryKey)).toEqual(Array.from(nexusKeys.ledgerEnd()));
		expect(opts.staleTime).toBe(2_000);
	});
});

describe("partyIdQueryOptions", () => {
	test("queryKey includes userId", async () => {
		const client = await createNexusClient({
			baseUrl: "http://localhost:7575",
			plugins: [
				{
					id: "mock-auth",
					auth: { getToken: async () => "token" },
				},
				tanstackQueryPlugin(),
			],
		});

		if (!client.query) throw new Error("query undefined");
		const opts = client.query.partyId({ userId: "alice" });
		expect(Array.from(opts.queryKey)).toEqual(Array.from(nexusKeys.partyId("alice")));
	});
});
