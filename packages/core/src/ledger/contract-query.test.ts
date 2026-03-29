import { describe, expect, test } from "bun:test";
import { CantonClient } from "../client/canton-client.ts";
import { ContractQuery } from "./contract-query.ts";

function makeContractPage(
	contracts: Array<{ contractId: string; payload?: Record<string, unknown> }>,
	nextPageToken?: string,
) {
	return {
		contracts: contracts.map((c) => ({
			contractId: c.contractId,
			templateId: { packageId: "pkg", moduleName: "Mod", entityName: "T" },
			payload: c.payload ?? {},
			createdAt: "2026-01-01T00:00:00Z",
			signatories: ["Alice::abc"],
			observers: [],
		})),
		nextPageToken,
	};
}

describe("ContractQuery", () => {
	test("fetchActiveContracts returns contracts from first page", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(makeContractPage([{ contractId: "c1" }, { contractId: "c2" }]));
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new ContractQuery(client);
		const result = await query.fetchActiveContracts({ templateId: "pkg:Mod:T" });
		server.stop();

		expect(result.contracts).toHaveLength(2);
		expect(result.contracts[0]?.contractId).toBe("c1");
	});

	test("fetchAllActiveContracts follows pagination", async () => {
		let callCount = 0;
		const server = Bun.serve({
			port: 0,
			async fetch(req) {
				const body = (await req.json()) as { pageToken?: string };
				callCount++;
				if (!body.pageToken) {
					return Response.json(makeContractPage([{ contractId: "c1" }], "token-2"));
				}
				return Response.json(makeContractPage([{ contractId: "c2" }]));
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new ContractQuery(client);
		const all = await query.fetchAllActiveContracts({ templateId: "pkg:Mod:T" });
		server.stop();

		expect(all).toHaveLength(2);
		expect(callCount).toBe(2);
	});

	test("fetchContractById returns matching contract", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(
					makeContractPage([
						{ contractId: "c1", payload: { name: "Alice" } },
						{ contractId: "c2", payload: { name: "Bob" } },
					]),
				);
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new ContractQuery(client);
		const contract = await query.fetchContractById("pkg:Mod:T", "c2");
		server.stop();

		expect(contract?.contractId).toBe("c2");
		expect(contract?.payload).toEqual({ name: "Bob" });
	});

	test("fetchContractById returns undefined for unknown contractId", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(makeContractPage([{ contractId: "c1" }]));
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new ContractQuery(client);
		const contract = await query.fetchContractById("pkg:Mod:T", "unknown-id");
		server.stop();

		expect(contract).toBeUndefined();
	});

	test("fetchContractByKey finds contract matching predicate", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(
					makeContractPage([
						{ contractId: "c1", payload: { owner: "Alice", amount: "100" } },
						{ contractId: "c2", payload: { owner: "Bob", amount: "200" } },
						{ contractId: "c3", payload: { owner: "Alice", amount: "50" } },
					]),
				);
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new ContractQuery(client);
		type Payload = { owner: string; amount: string };
		const contract = await query.fetchContractByKey<Payload>("pkg:Mod:T", (p) => p.owner === "Bob");
		server.stop();

		expect(contract?.contractId).toBe("c2");
		expect(contract?.payload.owner).toBe("Bob");
	});

	test("fetchContractByKey returns undefined when no match", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(makeContractPage([{ contractId: "c1", payload: { owner: "Alice" } }]));
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new ContractQuery(client);
		const contract = await query.fetchContractByKey<{ owner: string }>(
			"pkg:Mod:T",
			(p) => p.owner === "Charlie",
		);
		server.stop();

		expect(contract).toBeUndefined();
	});

	test("fetchContractByKey returns first match when multiple match", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(
					makeContractPage([
						{ contractId: "c1", payload: { owner: "Alice", seq: 1 } },
						{ contractId: "c2", payload: { owner: "Alice", seq: 2 } },
					]),
				);
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new ContractQuery(client);
		type P = { owner: string; seq: number };
		const contract = await query.fetchContractByKey<P>("pkg:Mod:T", (p) => p.owner === "Alice");
		server.stop();

		// Returns the first match
		expect(contract?.contractId).toBe("c1");
	});
});
