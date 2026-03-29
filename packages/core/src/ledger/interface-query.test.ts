import { describe, expect, test } from "bun:test";
import { CantonClient } from "../client/canton-client.ts";
import { InterfaceQuery } from "./interface-query.ts";

describe("InterfaceQuery", () => {
	function makeInterfacePage(
		interfaces: Array<{ contractId: string; interfaceView?: Record<string, unknown> }>,
		nextPageToken?: string,
	) {
		return {
			interfaces: interfaces.map((c) => ({
				contractId: c.contractId,
				templateId: { packageId: "pkg", moduleName: "Mod", entityName: "T" },
				payload: {},
				interfaceId: "pkg:Iface:IAsset",
				interfaceView: c.interfaceView ?? { amount: 100 },
				signatories: ["Alice::abc"],
				observers: [],
				createdAt: "2026-01-01T00:00:00Z",
			})),
			nextPageToken,
		};
	}

	test("fetchActiveInterfaces returns interface contracts", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json(
					makeInterfacePage([
						{ contractId: "c1", interfaceView: { amount: 100 } },
						{ contractId: "c2", interfaceView: { amount: 200 } },
					]),
				);
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new InterfaceQuery(client);
		const result = await query.fetchActiveInterfaces({ interfaceId: "pkg:Iface:IAsset" });
		server.stop();

		expect(result.interfaces).toHaveLength(2);
		expect(result.interfaces[0]?.interfaceId).toBe("pkg:Iface:IAsset");
	});

	test("fetchAllActiveInterfaces follows pagination", async () => {
		let callCount = 0;
		const server = Bun.serve({
			port: 0,
			async fetch(req) {
				const body = (await req.json()) as { pageToken?: string };
				callCount++;
				if (!body.pageToken) {
					return Response.json(makeInterfacePage([{ contractId: "c1" }], "page-2"));
				}
				return Response.json(makeInterfacePage([{ contractId: "c2" }]));
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new InterfaceQuery(client);
		const all = await query.fetchAllActiveInterfaces({ interfaceId: "pkg:Iface:IAsset" });
		server.stop();

		expect(all).toHaveLength(2);
		expect(callCount).toBe(2);
		expect(all[0]?.contractId).toBe("c1");
		expect(all[1]?.contractId).toBe("c2");
	});

	test("fetchActiveInterfaces returns empty when no contracts", async () => {
		const server = Bun.serve({
			port: 0,
			fetch() {
				return Response.json({ interfaces: [], nextPageToken: undefined });
			},
		});

		const client = new CantonClient({
			baseUrl: `http://localhost:${server.port}`,
			getToken: async () => "token",
		});
		const query = new InterfaceQuery(client);
		const result = await query.fetchActiveInterfaces({ interfaceId: "pkg:Iface:IAsset" });
		server.stop();

		expect(result.interfaces).toHaveLength(0);
	});
});
