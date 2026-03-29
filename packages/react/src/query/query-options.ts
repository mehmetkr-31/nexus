import type {
	ActiveContractsResponse,
	ActiveInterfacesResponse,
	NexusClient,
	TemplateDescriptor,
} from "@nexus-framework/core";
import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { type ContractQueryFilters, nexusKeys } from "./query-keys.ts";

// ─── Contract queryOptions factory ───────────────────────────────────────────

export interface ContractQueryOptionsInput<_T = Record<string, unknown>> {
	client: NexusClient;
	templateId: string | TemplateDescriptor;
	parties?: string[];
	filter?: Record<string, unknown>;
	/**
	 * If true, fetch all pages automatically (may be slow on large datasets).
	 * Default: false — fetches first page only.
	 */
	fetchAll?: boolean;
	/** Passed through to TanStack Query */
	enabled?: boolean;
	staleTime?: number;
}

/**
 * Creates a TanStack Query `queryOptions` object for fetching active contracts.
 * Use with `useQuery` or `useSuspenseQuery`.
 *
 * @example
 * ```ts
 * const options = contractQueryOptions({
 *   client: nexus,
 *   templateId: "pkg:Mod:Iou",
 *   parties: ["Alice::abc"],
 * });
 *
 * const { data } = useQuery(options);
 * ```
 */
export function contractQueryOptions<T = Record<string, unknown>>(
	input: ContractQueryOptionsInput<T>,
) {
	const filters: ContractQueryFilters = {
		parties: input.parties,
		filter: input.filter,
	};

	const stableId =
		typeof input.templateId === "string"
			? input.templateId
			: `${input.templateId.packageName}:${input.templateId.moduleName}:${input.templateId.entityName}`;

	return queryOptions<ActiveContractsResponse<T>>({
		queryKey: nexusKeys.contractsQuery(stableId, filters),
		queryFn: async () => {
			let finalTemplateId = input.templateId;

			// If we have a descriptor and the package-discovery plugin is active, resolve it
			if (typeof finalTemplateId !== "string" && input.client.packages) {
				const resolver = input.client.packages as import("@nexus-framework/core").PackageResolver;
				finalTemplateId = await resolver.resolveTemplateId(finalTemplateId);
			} else if (typeof finalTemplateId !== "string") {
				// Fallback if plugin missing
				finalTemplateId = `${finalTemplateId.packageName}:${finalTemplateId.moduleName}:${finalTemplateId.entityName}`;
			}

			if (input.fetchAll) {
				const contracts = await input.client.ledger.contracts.fetchAllActiveContracts<T>({
					templateId: finalTemplateId,
					parties: input.parties,
					filter: input.filter,
				});
				return { contracts, nextPageToken: undefined };
			}
			return input.client.ledger.contracts.fetchActiveContracts<T>({
				templateId: finalTemplateId,
				parties: input.parties,
				filter: input.filter,
			});
		},
		enabled: input.enabled,
		staleTime: input.staleTime,
	});
}

// ─── Ledger end queryOptions ──────────────────────────────────────────────────

export function ledgerEndQueryOptions(client: NexusClient) {
	return queryOptions({
		queryKey: nexusKeys.ledgerEnd(),
		queryFn: () => client.ledger.identity.getLedgerEnd(),
		staleTime: 2_000,
	});
}

// ─── Synchronizers queryOptions ───────────────────────────────────────────────

export function synchronizersQueryOptions(client: NexusClient) {
	return queryOptions({
		queryKey: nexusKeys.synchronizers(),
		queryFn: () => client.ledger.identity.getConnectedSynchronizers(),
		staleTime: 30_000,
	});
}

// ─── Party ID queryOptions ────────────────────────────────────────────────────

export function partyIdQueryOptions(client: NexusClient, userId: string) {
	return queryOptions({
		queryKey: nexusKeys.partyId(userId),
		queryFn: () => client.auth.partyId.resolvePartyId(userId),
		staleTime: 5 * 60 * 1000, // 5 minutes — matches PartyIdResolver cache TTL
	});
}

// ─── Interface queryOptions factory ──────────────────────────────────────────

export interface InterfaceQueryOptionsInput<
	_TView = Record<string, unknown>,
	_TPayload = Record<string, unknown>,
> {
	client: NexusClient;
	interfaceId: string | TemplateDescriptor;
	parties?: string[];
	fetchAll?: boolean;
	includeCreateArguments?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

/**
 * Creates a TanStack Query `queryOptions` object for fetching active contracts
 * viewed through a Daml interface.
 */
export function interfaceQueryOptions<
	TView = Record<string, unknown>,
	TPayload = Record<string, unknown>,
>(input: InterfaceQueryOptionsInput<TView, TPayload>) {
	const filters: ContractQueryFilters = { parties: input.parties };

	const stableId =
		typeof input.interfaceId === "string"
			? input.interfaceId
			: `${input.interfaceId.packageName}:${input.interfaceId.moduleName}:${input.interfaceId.entityName}`;

	return queryOptions<ActiveInterfacesResponse<TView, TPayload>>({
		queryKey: nexusKeys.interfaceQuery(stableId, filters),
		queryFn: async () => {
			let finalInterfaceId = input.interfaceId;

			if (typeof finalInterfaceId !== "string" && input.client.packages) {
				const resolver = input.client.packages as import("@nexus-framework/core").PackageResolver;
				finalInterfaceId = await resolver.resolveTemplateId(finalInterfaceId);
			} else if (typeof finalInterfaceId !== "string") {
				finalInterfaceId = `${finalInterfaceId.packageName}:${finalInterfaceId.moduleName}:${finalInterfaceId.entityName}`;
			}

			if (input.fetchAll) {
				const contracts = await input.client.ledger.contracts.fetchAllActiveInterfaces<
					TView,
					TPayload
				>({
					interfaceId: finalInterfaceId,
					parties: input.parties,
					includeCreateArguments: input.includeCreateArguments,
				});
				return { contracts, nextPageToken: undefined };
			}
			return input.client.ledger.contracts.fetchActiveInterfaces<TView, TPayload>({
				interfaceId: finalInterfaceId,
				parties: input.parties,
				includeCreateArguments: input.includeCreateArguments,
			});
		},
		enabled: input.enabled,
		staleTime: input.staleTime,
	});
}

// ─── Prefetch helpers ─────────────────────────────────────────────────────────

/**
 * Prefetch active contracts into a QueryClient.
 * Useful in Next.js `generateStaticParams` / `loader` functions.
 */
export async function prefetchContracts<T = Record<string, unknown>>(
	queryClient: QueryClient,
	input: ContractQueryOptionsInput<T>,
): Promise<void> {
	await queryClient.prefetchQuery(contractQueryOptions(input));
}
