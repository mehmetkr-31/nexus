import type {
	ActiveContractsResponse,
	ActiveInterfacesResponse,
	NexusClient,
	TemplateDescriptor,
} from "@nexus-framework/core";
import { queryOptions } from "@tanstack/react-query";
import { type ContractQueryFilters, nexusKeys } from "./query-keys.ts";

// ─── Contract queryOptions factory ───────────────────────────────────────────

export interface ContractQueryOptionsParams<_T = Record<string, unknown>> {
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

export interface ContractQueryOptionsInput<T = Record<string, unknown>>
	extends ContractQueryOptionsParams<T> {
	client: NexusClient;
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

export interface LedgerEndQueryOptionsInput {
	client: NexusClient;
}

export function ledgerEndQueryOptions(input: LedgerEndQueryOptionsInput) {
	return queryOptions({
		queryKey: nexusKeys.ledgerEnd(),
		queryFn: () => input.client.ledger.identity.getLedgerEnd(),
		staleTime: 2_000,
	});
}

// ─── Synchronizers queryOptions ───────────────────────────────────────────────

export interface SynchronizersQueryOptionsInput {
	client: NexusClient;
}

export function synchronizersQueryOptions(input: SynchronizersQueryOptionsInput) {
	return queryOptions({
		queryKey: nexusKeys.synchronizers(),
		queryFn: () => input.client.ledger.identity.getConnectedSynchronizers(),
		staleTime: 30_000,
	});
}

// ─── Party ID queryOptions ────────────────────────────────────────────────────

export interface PartyIdQueryOptionsParams {
	userId: string;
}

export interface PartyIdQueryOptionsInput extends PartyIdQueryOptionsParams {
	client: NexusClient;
}

export function partyIdQueryOptions(input: PartyIdQueryOptionsInput) {
	return queryOptions({
		queryKey: nexusKeys.partyId(input.userId),
		queryFn: () => input.client.auth.partyId.resolvePartyId(input.userId),
		staleTime: Infinity,
	});
}

// ─── Interface queryOptions factory ──────────────────────────────────────────

export interface InterfaceQueryOptionsParams<
	_TView = Record<string, unknown>,
	_TPayload = Record<string, unknown>,
> {
	interfaceId: string | TemplateDescriptor;
	parties?: string[];
	/**
	 * If true, fetch all pages automatically.
	 * Default: false — fetches first page only.
	 */
	fetchAll?: boolean;
	/** If true, the response will include createArguments (payload) for each contract. */
	includeCreateArguments?: boolean;
	/** Passed through to TanStack Query */
	enabled?: boolean;
	staleTime?: number;
}

export interface InterfaceQueryOptionsInput<TView, TPayload>
	extends InterfaceQueryOptionsParams<TView, TPayload> {
	client: NexusClient;
}

/**
 * Creates a TanStack Query `queryOptions` object for fetching active contracts
 * viewed through a Daml interface.
 */
export function interfaceQueryOptions<
	TView = Record<string, unknown>,
	TPayload = Record<string, unknown>,
>(input: InterfaceQueryOptionsInput<TView, TPayload>) {
	const stableId =
		typeof input.interfaceId === "string"
			? input.interfaceId
			: `${input.interfaceId.packageName}:${input.interfaceId.moduleName}:${input.interfaceId.entityName}`;

	return queryOptions<ActiveInterfacesResponse<TView, TPayload>>({
		queryKey: nexusKeys.interfaceQuery(stableId, { parties: input.parties }),
		queryFn: async () => {
			let finalInterfaceId = input.interfaceId;

			if (typeof finalInterfaceId !== "string" && input.client.packages) {
				const resolver = input.client.packages as import("@nexus-framework/core").PackageResolver;
				finalInterfaceId = await resolver.resolveTemplateId(finalInterfaceId);
			} else if (typeof finalInterfaceId !== "string") {
				finalInterfaceId = `${finalInterfaceId.packageName}:${finalInterfaceId.moduleName}:${finalInterfaceId.entityName}`;
			}

			if (input.fetchAll) {
				const interfaces = await input.client.ledger.interfaces.fetchAllActiveInterfaces<
					TView,
					TPayload
				>({
					interfaceId: finalInterfaceId,
					parties: input.parties,
					includeCreateArguments: input.includeCreateArguments,
				});
				return { interfaces, nextPageToken: undefined };
			}
			return input.client.ledger.interfaces.fetchActiveInterfaces<TView, TPayload>({
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

// Prefetch helpers are internal-only. Use nexus.prefetch.X(...)
