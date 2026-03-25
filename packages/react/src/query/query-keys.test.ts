import { describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { invalidateAllNexusQueries, invalidateContractQueries, nexusKeys } from "./query-keys.ts";

describe("nexusKeys", () => {
	test("all() returns correct root key", () => {
		expect(nexusKeys.all()).toEqual(["nexus"]);
	});

	test("contracts() is prefixed with all()", () => {
		expect(nexusKeys.contracts()).toEqual(["nexus", "contracts"]);
	});

	test("contractsByTemplate() includes templateId", () => {
		expect(nexusKeys.contractsByTemplate("pkg:Mod:Iou")).toEqual([
			"nexus",
			"contracts",
			"pkg:Mod:Iou",
		]);
	});

	test("contractsQuery() includes templateId and filters", () => {
		const key = nexusKeys.contractsQuery("pkg:Mod:Iou", {
			parties: ["Alice::abc"],
		});
		expect(key[0]).toBe("nexus");
		expect(key[1]).toBe("contracts");
		expect(key[2]).toBe("pkg:Mod:Iou");
		expect(key[3]).toEqual({ parties: ["Alice::abc"] });
	});

	test("contractsQuery() with no filters uses empty object", () => {
		const key = nexusKeys.contractsQuery("pkg:Mod:Iou");
		expect(key[3]).toEqual({});
	});

	test("ledgerEnd() returns correct key", () => {
		expect(nexusKeys.ledgerEnd()).toEqual(["nexus", "ledger-end"]);
	});

	test("partyId() includes userId", () => {
		expect(nexusKeys.partyId("alice")).toEqual(["nexus", "party", "alice"]);
	});

	test("different templateIds produce different keys", () => {
		const k1 = nexusKeys.contractsByTemplate("pkg:Mod:Iou");
		const k2 = nexusKeys.contractsByTemplate("pkg:Mod:IouTransfer");
		expect(k1).not.toEqual(k2);
	});
});

describe("invalidateContractQueries", () => {
	test("invalidates matching template queries", async () => {
		const qc = new QueryClient();
		let invalidated: (readonly unknown[])[] = [];

		// Spy: override invalidateQueries
		const orig = qc.invalidateQueries.bind(qc);
		qc.invalidateQueries = async (filters?: { queryKey?: readonly unknown[] }) => {
			if (filters?.queryKey) invalidated = [...invalidated, filters.queryKey];
			return orig(filters);
		};

		await invalidateContractQueries(qc, ["pkg:Mod:Iou", "pkg:Mod:IouTransfer"]);

		expect(invalidated).toHaveLength(2);
		expect(invalidated[0]).toEqual(["nexus", "contracts", "pkg:Mod:Iou"]);
		expect(invalidated[1]).toEqual(["nexus", "contracts", "pkg:Mod:IouTransfer"]);
	});
});

describe("invalidateAllNexusQueries", () => {
	test("invalidates with root key", async () => {
		const qc = new QueryClient();
		// Capture first element of the queryKey passed to invalidateQueries
		let capturedFirst: unknown;
		let capturedLength = 0;

		qc.invalidateQueries = async (filters?: { queryKey?: readonly unknown[] }) => {
			capturedFirst = filters?.queryKey?.[0];
			capturedLength = filters?.queryKey?.length ?? 0;
		};

		await invalidateAllNexusQueries(qc);
		expect(String(capturedFirst)).toBe("nexus");
		expect(capturedLength).toBe(1);
	});
});
