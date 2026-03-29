import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useNexusClient } from "../context/nexus-provider.tsx";
import { partyIdQueryOptions } from "../query/query-options.ts";

/**
 * Resolves a userId to its Canton Party ID using TanStack Query.
 * Cached for 5 minutes (matching the PartyIdResolver in-memory cache).
 *
 * @deprecated Prefer `nexus.usePartyId` from `createNexusClient()`.
 *
 * @example
 * ```tsx
 * const { data: partyId } = usePartyId("alice");
 * // partyId === "Alice::abc123..."
 * ```
 */
export function usePartyId(userId: string): UseQueryResult<string> {
	const client = useNexusClient();
	return useQuery(partyIdQueryOptions(client, userId));
}
