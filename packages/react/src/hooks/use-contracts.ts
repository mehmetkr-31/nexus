import type { ActiveContractsResponse } from "@nexus-framework/core";
import {
	type UseQueryResult,
	type UseSuspenseQueryResult,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useNexusClient } from "../context/nexus-provider.tsx";
import { contractQueryOptions } from "../query/query-options.ts";

export interface UseContractsOptions<_T = Record<string, unknown>> {
	templateId: string;
	parties?: string[];
	filter?: Record<string, unknown>;
	fetchAll?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

/**
 * Fetch active Daml contracts with TanStack Query.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useContracts<IouPayload>({
 *   templateId: "pkg:Mod:Iou",
 *   parties: ["Alice::abc"],
 * });
 *
 * data?.contracts.map(c => <div key={c.contractId}>{c.payload.amount}</div>)
 * ```
 */
export function useContracts<T = Record<string, unknown>>(
	options: UseContractsOptions<T>,
): UseQueryResult<ActiveContractsResponse<T>> {
	const client = useNexusClient();
	return useQuery(contractQueryOptions<T>({ client, ...options }));
}

/**
 * Suspense variant of useContracts.
 * Throws a promise while loading — wrap in React `<Suspense>`.
 */
export function useContractsSuspense<T = Record<string, unknown>>(
	options: UseContractsOptions<T>,
): UseSuspenseQueryResult<ActiveContractsResponse<T>> {
	const client = useNexusClient();
	return useSuspenseQuery(contractQueryOptions<T>({ client, ...options }));
}
