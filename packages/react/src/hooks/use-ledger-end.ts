import type { LedgerEnd, SynchronizerInfo } from "@nexus-framework/core";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useNexusClient } from "../context/nexus-provider.tsx";
import { ledgerEndQueryOptions, synchronizersQueryOptions } from "../query/query-options.ts";

/**
 * Returns the current ledger end offset.
 * Refreshes every 2 seconds by default (staleTime: 2000).
 */
export function useLedgerEnd(): UseQueryResult<LedgerEnd> {
	const client = useNexusClient();
	return useQuery(ledgerEndQueryOptions(client));
}

/**
 * Returns the list of connected Canton synchronizers.
 * Useful for health checks and multi-domain scenarios.
 */
export function useSynchronizers(): UseQueryResult<SynchronizerInfo[]> {
	const client = useNexusClient();
	return useQuery(synchronizersQueryOptions(client));
}
