import type {
	ActiveContractsResponse,
	ActiveInterfacesResponse,
	NexusClient,
	NexusTemplateIdentifier,
	TemplateDescriptor,
} from "@nexus-framework/core";
import { toStableTemplateId } from "@nexus-framework/core";
import { queryOptions } from "@tanstack/react-query";
import { type ContractQueryFilters, nexusKeys } from "./query-keys.ts";

// ─── Contract queryOptions factory ───────────────────────────────────────────

export interface ContractQueryOptionsParams<_T = unknown> {
	templateId: NexusTemplateIdentifier;
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

export interface ContractQueryOptionsInput<T = unknown> extends ContractQueryOptionsParams<T> {
	client: NexusClient;
}

/**
 * Creates a TanStack Query `queryOptions` object for fetching active contracts.
 * Use with `useQuery` or `useSuspenseQuery`.
 */
export function contractQueryOptions<T = unknown>(input: ContractQueryOptionsInput<T>) {
	const filters: ContractQueryFilters = {
		parties: input.parties,
		filter: input.filter,
	};

	const stableId = toStableTemplateId(input.templateId);

	return queryOptions<ActiveContractsResponse<T>>({
		queryKey: nexusKeys.contractsQuery(stableId, filters),
		queryFn: async () => {
			if (input.fetchAll) {
				const contracts = await input.client.ledger.contracts.fetchAllActiveContracts<T>({
					templateId: input.templateId,
					parties: input.parties,
					filter: input.filter,
				});
				return { contracts, nextPageToken: undefined };
			}
			return input.client.ledger.contracts.fetchActiveContracts<T>({
				templateId: input.templateId,
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

export interface InterfaceQueryOptionsParams<_TView = unknown, _TPayload = unknown> {
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

export interface InterfaceQueryOptionsInput<TView = unknown, TPayload = unknown>
	extends InterfaceQueryOptionsParams<TView, TPayload> {
	client: NexusClient;
}

/**
 * Creates a TanStack Query `queryOptions` object for fetching active contracts
 * viewed through a Daml interface.
 */
export function interfaceQueryOptions<TView = unknown, TPayload = unknown>(
	input: InterfaceQueryOptionsInput<TView, TPayload>,
) {
	const stableId = toStableTemplateId(input.interfaceId);

	return queryOptions<ActiveInterfacesResponse<TView, TPayload>>({
		queryKey: nexusKeys.interfaceQuery(stableId, { parties: input.parties }),
		queryFn: async () => {
			if (input.fetchAll) {
				const interfaces = await input.client.ledger.interfaces.fetchAllActiveInterfaces<
					TView,
					TPayload
				>({
					interfaceId: input.interfaceId,
					parties: input.parties,
					includeCreateArguments: input.includeCreateArguments,
				});
				return { interfaces, nextPageToken: undefined };
			}
			return input.client.ledger.interfaces.fetchActiveInterfaces<TView, TPayload>({
				interfaceId: input.interfaceId,
				parties: input.parties,
				includeCreateArguments: input.includeCreateArguments,
			});
		},
		enabled: input.enabled,
		staleTime: input.staleTime,
	});
}

// ─── Single Fetch queryOptions ────────────────────────────────────────────────

export function fetchByIdOptions<T = unknown>(input: {
	client: NexusClient;
	templateId: NexusTemplateIdentifier;
	contractId: string;
	parties?: string[];
	enabled?: boolean;
	staleTime?: number;
}) {
	const stableId = toStableTemplateId(input.templateId);

	return queryOptions({
		queryKey: nexusKeys.contractById(stableId, input.contractId, input.parties),
		queryFn: () =>
			input.client.ledger.contracts.fetchContractById<T>(
				input.templateId,
				input.contractId,
				input.parties,
			),
		enabled: input.enabled,
		staleTime: input.staleTime,
	});
}

export function fetchByKeyOptions<T = unknown, K = unknown>(input: {
	client: NexusClient;
	templateId: NexusTemplateIdentifier;
	key: K;
	keyPredicate: (payload: T) => boolean;
	parties?: string[];
	enabled?: boolean;
	staleTime?: number;
}) {
	const stableId = toStableTemplateId(input.templateId);

	return queryOptions({
		queryKey: nexusKeys.contractByKey(stableId, input.key, input.parties),
		queryFn: () =>
			input.client.ledger.contracts.fetchContractByKey<T>(
				input.templateId,
				input.keyPredicate,
				input.parties,
			),
		enabled: input.enabled,
		staleTime: input.staleTime,
	});
}

// ─── Prefetch helpers ─────────────────────────────────────────────────────────

// Prefetch helpers are internal-only. Use nexus.prefetch.X(...)
