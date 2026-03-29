/**
 * Nexus Query Key Factories
 *
 * Provides a structured, type-safe query key hierarchy for TanStack Query.
 * All keys are prefixed with "nexus" to avoid collisions with other query keys.
 *
 * Key hierarchy:
 *   ["nexus"]
 *   ["nexus", "contracts"]
 *   ["nexus", "contracts", templateId]
 *   ["nexus", "contracts", templateId, { parties, filter }]
 *   ["nexus", "ledger-end"]
 *   ["nexus", "synchronizers"]
 *   ["nexus", "party", userId]
 */

export type NexusQueryKey = readonly unknown[];

export interface ContractQueryFilters {
	parties?: string[];
	filter?: Record<string, unknown>;
}

// ─── nexusKeys ────────────────────────────────────────────────────────────────

export const nexusKeys = {
	/** Root key — invalidate ALL Nexus queries */
	all: () => ["nexus"] as const,

	/** All contract queries */
	contracts: () => ["nexus", "contracts"] as const,

	/** All queries for a specific Daml template */
	contractsByTemplate: (templateId: string) => ["nexus", "contracts", templateId] as const,

	/**
	 * A specific contract query with party/filter scope.
	 * Used as the exact queryKey for useContracts().
	 */
	contractsQuery: (templateId: string, filters?: ContractQueryFilters) =>
		["nexus", "contracts", templateId, filters ?? {}] as const,

	/** All interface queries */
	interfaces: () => ["nexus", "interfaces"] as const,

	/** All queries for a specific Daml interface */
	interfacesByType: (interfaceId: string) => ["nexus", "interfaces", interfaceId] as const,

	/** A specific interface query with party scope */
	interfaceQuery: (interfaceId: string, filters?: ContractQueryFilters) =>
		["nexus", "interfaces", interfaceId, filters ?? {}] as const,

	/** Ledger end offset */
	ledgerEnd: () => ["nexus", "ledger-end"] as const,

	/** Connected synchronizers */
	synchronizers: () => ["nexus", "synchronizers"] as const,

	/** Party ID for a given userId */
	partyId: (userId: string) => ["nexus", "party", userId] as const,
	/** Transaction commit status */
	transactionStatus: (transactionId: string) => ["nexus", "transaction", transactionId] as const,
} as const;

// ─── Cache invalidation helpers ───────────────────────────────────────────────

import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidate all active-contract queries for one or more Daml templates.
 * Call this after a successful create/exercise command to keep the UI in sync.
 *
 * @example
 * ```ts
 * await invalidateContractQueries(queryClient, ["pkg:Mod:Iou", "pkg:Mod:IouTransfer"]);
 * ```
 */
export async function invalidateContractQueries(
	queryClient: QueryClient,
	templateIds: string[],
): Promise<void> {
	await Promise.all(
		templateIds.map((templateId) =>
			queryClient.invalidateQueries({
				queryKey: nexusKeys.contractsByTemplate(templateId),
			}),
		),
	);
}

/**
 * Invalidate ALL Nexus queries — use sparingly (e.g., after logout or party switch).
 */
export async function invalidateAllNexusQueries(queryClient: QueryClient): Promise<void> {
	await queryClient.invalidateQueries({ queryKey: nexusKeys.all() });
}
