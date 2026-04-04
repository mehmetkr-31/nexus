// THIS FILE IS SERVER-SAFE AND CAN BE IMPORTED INTO SERVER COMPONENTS

import type { NexusClient, NexusPlugin, NexusTemplateIdentifier } from "@nexus-framework/core";
import {
	type ContractQueryOptionsParams,
	contractQueryOptions,
	fetchByIdOptions,
	fetchByKeyOptions,
	type InterfaceQueryOptionsParams,
	interfaceQueryOptions,
	ledgerEndQueryOptions,
	type PagedContractsQueryOptionsParams,
	pagedContractsQueryOptions,
	type PartyIdQueryOptionsParams,
	partyIdQueryOptions,
	synchronizersQueryOptions,
	transactionStatusQueryOptions,
} from "../query/query-options";
import type { TanstackQueryActions } from "./tanstack-query";

/**
 * Server-safe subset of the TanStack Query plugin.
 * Provides only the `init` method, which returns the `query` object for prefetching.
 */
export function tanstackQueryServerPlugin(): NexusPlugin<{
	query: TanstackQueryActions["query"];
}> {
	return {
		id: "tanstack-query-server",
		init: (client: NexusClient) => ({
			query: {
				contracts: <T = Record<string, unknown>>(params: ContractQueryOptionsParams<T>) =>
					contractQueryOptions<T>({ client, ...params }),
				pagedContracts: <T = Record<string, unknown>>(
					params: PagedContractsQueryOptionsParams<T>,
				) => pagedContractsQueryOptions<T>({ client, ...params }),
				contractById: <T = Record<string, unknown>>(params: {
					templateId: NexusTemplateIdentifier;
					contractId: string;
					parties?: string[];
					enabled?: boolean;
					staleTime?: number;
				}) => fetchByIdOptions<T>({ client, ...params }),
				contractByKey: <T = Record<string, unknown>, K = unknown>(params: {
					templateId: NexusTemplateIdentifier;
					key: K;
					keyPredicate: (payload: T) => boolean;
					parties?: string[];
					enabled?: boolean;
					staleTime?: number;
				}) => fetchByKeyOptions<T, K>({ client, ...params }),
				interfaces: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
					params: InterfaceQueryOptionsParams<TView, TPayload>,
				) => interfaceQueryOptions<TView, TPayload>({ client, ...params }),
				transactionStatus: (params: { transactionId: string; timeoutMs?: number }) =>
					transactionStatusQueryOptions({ client, ...params }),
				ledgerEnd: () => ledgerEndQueryOptions({ client }),
				partyId: (params: PartyIdQueryOptionsParams) => partyIdQueryOptions({ client, ...params }),
				synchronizers: () => synchronizersQueryOptions({ client }),
			},
		}),
	};
}
