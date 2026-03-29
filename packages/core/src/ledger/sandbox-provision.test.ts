import { describe, expect, it, mock, spyOn } from "bun:test";
import { JwtManager } from "../auth/jwt-manager.ts";
import { provisionSandboxUser } from "./sandbox-provision.ts";

describe("provisionSandboxUser", () => {
	const options = {
		ledgerApiUrl: "http://localhost:7575",
		userId: "alice",
		secret: "mock-secret",
	};

	it("should successfully allocate party with modern Canton (partyDetails)", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");
		const jwtSpy = spyOn(JwtManager.prototype, "getAdminToken").mockResolvedValue(
			"mocked-admin-token",
		);

		// 1. Party Allocation
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ partyDetails: { party: "Alice::1220hash" } }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		// 2. User Creation
		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

		// 3. User Rights Grant
		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

		const partyId = await provisionSandboxUser(options);

		expect(partyId).toBe("Alice::1220hash");
		expect(fetchSpy).toHaveBeenCalledTimes(3);

		// Assert allocation request format
		const allocReq = fetchSpy.mock.calls[0];
		if (!allocReq) throw new Error("No allocation request sent");
		expect(allocReq[0]).toBe("http://localhost:7575/v2/parties");
		expect(allocReq[1]?.method).toBe("POST");
		expect(JSON.parse(allocReq[1]?.body as string)).toEqual({
			partyIdHint: "Alice",
			displayName: "Alice",
		});

		fetchSpy.mockRestore();
		jwtSpy.mockRestore();
	});

	it("should fallback to list parties on ALREADY_EXISTS without partyId in error", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");
		const jwtSpy = spyOn(JwtManager.prototype, "getAdminToken").mockResolvedValue(
			"mocked-admin-token",
		);

		// 1. Party Allocation fails with ALREADY_EXISTS (no ID)
		fetchSpy.mockResolvedValueOnce(
			new Response("ALREADY_EXISTS", {
				status: 400,
				headers: { "Content-Type": "text/plain" },
			}),
		);

		// 2. Party List returns existing party
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ partyDetails: [{ party: "Alice::1220hash" }] }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		// 3. User Creation (already exists, error is ignored)
		fetchSpy.mockResolvedValueOnce(new Response("ALREADY_EXISTS", { status: 400 }));

		// 4. User Rights Grant
		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

		const partyId = await provisionSandboxUser(options);

		expect(partyId).toBe("Alice::1220hash");
		expect(fetchSpy).toHaveBeenCalledTimes(4);

		const listReq = fetchSpy.mock.calls[1];
		if (!listReq) throw new Error("No list request sent");
		expect(listReq[0]).toBe("http://localhost:7575/v2/parties");
		expect(listReq[1]?.method).toBeUndefined(); // Default GET

		fetchSpy.mockRestore();
		jwtSpy.mockRestore();
	});

	it("should extract partyId from ALREADY_EXISTS error message if possible", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");
		const jwtSpy = spyOn(JwtManager.prototype, "getAdminToken").mockResolvedValue(
			"mocked-admin-token",
		);

		// 1. Party Allocation fails with detailed error message
		fetchSpy.mockResolvedValueOnce(
			new Response(
				"The submitted request has invalid arguments: Party already exists: party Alice::1220hash... is already allocated on this node",
				{
					status: 400,
					headers: { "Content-Type": "text/plain" },
				},
			),
		);

		// 2. User Creation
		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

		// 3. User Rights Grant
		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

		const partyId = await provisionSandboxUser(options);

		// the regex will capture 'Alice::1220hash...' and then toDamlLFPartyId strips from '.'
		expect(partyId).toBe("Alice::1220hash");
		expect(fetchSpy).toHaveBeenCalledTimes(3);

		fetchSpy.mockRestore();
		jwtSpy.mockRestore();
	});

	it("should clean up participant suffix from partyId", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");
		const jwtSpy = spyOn(JwtManager.prototype, "getAdminToken").mockResolvedValue(
			"mocked-admin-token",
		);

		// 1. Party Allocation
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ partyDetails: { party: "Alice::1220hash.participant123" } }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

		const partyId = await provisionSandboxUser(options);

		// The `.participant123` suffix should be stripped
		expect(partyId).toBe("Alice::1220hash");

		fetchSpy.mockRestore();
		jwtSpy.mockRestore();
	});

	it("should support legacy Canton (partyRecord) responses", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");
		const jwtSpy = spyOn(JwtManager.prototype, "getAdminToken").mockResolvedValue(
			"mocked-admin-token",
		);

		// 1. Party Allocation
		fetchSpy.mockResolvedValueOnce(
			new Response(JSON.stringify({ partyRecord: { party: "Alice::legacy" } }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
		fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

		const partyId = await provisionSandboxUser(options);

		expect(partyId).toBe("Alice::legacy");

		fetchSpy.mockRestore();
	});
});
