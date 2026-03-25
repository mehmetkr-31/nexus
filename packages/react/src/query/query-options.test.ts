import { describe, expect, test } from "bun:test";
import { createNexusClient } from "@nexus-framework/core";
import { QueryClient } from "@tanstack/react-query";
import { nexusKeys } from "./query-keys.ts";
import {
	contractQueryOptions,
	ledgerEndQueryOptions,
	partyIdQueryOptions,
} from "./query-options.ts";

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

const mockContracts = {
	contracts: [
		{
			contractId: "c1",
			templateId: { packageId: "pkg", moduleName: "Mod", entityName: "Iou" },
			payload: { amount: 100 },
			createdAt: "2026-01-01T00:00:00Z",
			signatories: ["Alice::abc"],
			observers: [],
		},
	],
};

describe("contractQueryOptions", () => {
	test("queryKey matches nexusKeys.contractsQuery structure", () => {
		const server = Bun.serve({ port: 0, fetch: () => Response.json({}) });
		const client = createNexusClient({
			ledgerApiUrl: `http://localhost:${server.port}`,
			auth: { type: "sandbox", secret: "s", userId: "alice", partyId: "Alice::abc" },
		});
		server.stop();

		const opts = contractQueryOptions({
			client,
			templateId: "pkg:Mod:Iou",
			parties: ["Alice::abc"],
		});

		const expected = nexusKeys.contractsQuery("pkg:Mod:Iou", { parties: ["Alice::abc"] });
		// Compare key contents (TanStack v5 brands queryKeys with type symbols — compare as array)
		expect(Array.from(opts.queryKey)).toEqual(Array.from(expected));
	});

	test("queryFn fetches and returns contracts via QueryClient", async () => {
		const server = makeMockServer({
			"/v2/state/active-contracts": mockContracts,
		});

		const client = createNexusClient({
			ledgerApiUrl: `http://localhost:${server.port}`,
			auth: { type: "sandbox", secret: "s", userId: "alice", partyId: "Alice::abc" },
		});

		const qc = new QueryClient();
		const opts = contractQueryOptions({ client, templateId: "pkg:Mod:Iou" });
		const result = await qc.fetchQuery(opts);
		server.stop();

		expect(result.contracts).toHaveLength(1);
		expect(result.contracts[0]?.contractId).toBe("c1");
	});
});

describe("ledgerEndQueryOptions", () => {
	test("queryKey matches nexusKeys.ledgerEnd() structure", () => {
		const client = createNexusClient({
			ledgerApiUrl: "http://localhost:7575",
			auth: { type: "sandbox", secret: "s", userId: "alice", partyId: "Alice::abc" },
		});

		const opts = ledgerEndQueryOptions(client);
		expect(Array.from(opts.queryKey)).toEqual(Array.from(nexusKeys.ledgerEnd()));
		expect(opts.staleTime).toBe(2_000);
	});
});

describe("partyIdQueryOptions", () => {
	test("queryKey includes userId", () => {
		const client = createNexusClient({
			ledgerApiUrl: "http://localhost:7575",
			auth: { type: "sandbox", secret: "s", userId: "alice", partyId: "Alice::abc" },
		});

		const opts = partyIdQueryOptions(client, "alice");
		expect(Array.from(opts.queryKey)).toEqual(Array.from(nexusKeys.partyId("alice")));
		expect(opts.staleTime).toBe(5 * 60 * 1000);
	});
});
