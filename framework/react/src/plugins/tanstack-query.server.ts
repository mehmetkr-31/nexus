// THIS FILE IS SERVER-SAFE AND CAN BE IMPORTED INTO SERVER COMPONENTS

import type { NexusClient, NexusPlugin } from "@nexus-framework/core";
import {
	type ContractQueryOptionsParams,
	contractQueryOptions,
	type InterfaceQueryOptionsParams,
	interfaceQueryOptions,
	ledgerEndQueryOptions,
	type PartyIdQueryOptionsParams,
	partyIdQueryOptions,
	synchronizersQueryOptions,
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
				interfaces: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
					params: InterfaceQueryOptionsParams<TView, TPayload>,
				) => interfaceQueryOptions<TView, TPayload>({ client, ...params }),
				ledgerEnd: () => ledgerEndQueryOptions({ client }),
				partyId: (params: PartyIdQueryOptionsParams) => partyIdQueryOptions({ client, ...params }),
				synchronizers: () => synchronizersQueryOptions({ client }),
			},
		}),
	};
}
