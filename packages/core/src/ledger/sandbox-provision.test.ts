import { describe, expect, it, mock, spyOn } from "bun:test";
import { JwtManager } from "../auth/jwt-manager.ts";
import { NexusLedgerError } from "../types/index.ts";
import { provisionSandboxUser } from "./sandbox-provision.ts";

// Mock JwtManager to avoid real JWT generation and signing
mock.module("../auth/jwt-manager.ts", () => {
	return {
		JwtManager: class MockJwtManager {
			async getAdminToken() {
				return "mocked-admin-token";
			}
		},
	};
});

describe("provisionSandboxUser", () => {
	const options = {
		ledgerApiUrl: "http://localhost:7575",
		userId: "alice",
		secret: "mock-secret",
	};

	it("should successfully allocate party with modern Canton (partyDetails)", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");

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
		expect(allocReq[0]).toBe("http://localhost:7575/v2/parties");
		expect(allocReq[1]?.method).toBe("POST");
		expect(JSON.parse(allocReq[1]?.body as string)).toEqual({
			partyIdHint: "Alice",
			displayName: "Alice",
		});

		fetchSpy.mockRestore();
	});

	it("should fallback to party list (partyDetails array) if allocation returns ALREADY_EXISTS without partyId", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");

		// 1. Party Allocation returns generic ALREADY_EXISTS (no ID)
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
		expect(listReq[0]).toBe("http://localhost:7575/v2/parties");
		expect(listReq[1]?.method).toBeUndefined(); // Default GET

		fetchSpy.mockRestore();
	});

	it("should extract party ID directly from Canton 3.x ALREADY_EXISTS error message", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");

		// 1. Party Allocation returns Canton 3.x specific ALREADY_EXISTS
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
	});

	it("should format Canton 3.4.x party IDs correctly (stripping participant suffix)", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");

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
	});

	it("should support legacy Canton (partyRecord) responses", async () => {
		const fetchSpy = spyOn(globalThis, "fetch");

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
