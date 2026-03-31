import type { ActiveContractsResponse, NexusClient } from "@nexus-framework/core";
import type { QueryClient } from "@tanstack/react-query";
import {
	contractQueryOptions,
	type ContractQueryOptionsParams,
	interfaceQueryOptions,
	type InterfaceQueryOptionsParams,
} from "../query/query-options.ts";

export interface GetLedgerDataOptions<_T = Record<string, unknown>> {
	templateId: string;
	parties?: string[];
	filter?: Record<string, unknown>;
	fetchAll?: boolean;
}

/**
 * Fetch ledger data in a Next.js Server Component.
 * Returns a typed response ready for use in RSC.
 *
 * @example
 * ```tsx
 * // app/page.tsx (Server Component)
 * import { getLedgerData } from "@nexus-framework/react/server";
 *
 * export default async function Page() {
 *   const nexus = await createServerNexusClient({ ... });
 *   const { contracts } = await getLedgerData<IouPayload>(nexus, {
 *     templateId: "pkg:Mod:Iou",
 *     parties: ["Alice::abc"],
 *   });
 *
 *   return contracts.map(c => <IouCard key={c.contractId} iou={c.payload} />);
 * }
 * ```
 */
export async function getLedgerData<T = Record<string, unknown>>(
	client: NexusClient,
	options: GetLedgerDataOptions<T>,
): Promise<ActiveContractsResponse<T>> {
	if (options.fetchAll) {
		const contracts = await client.ledger.contracts.fetchAllActiveContracts<T>({
			templateId: options.templateId,
			parties: options.parties,
			filter: options.filter,
		});
		return { contracts, nextPageToken: undefined };
	}

	return client.ledger.contracts.fetchActiveContracts<T>({
		templateId: options.templateId,
		parties: options.parties,
		filter: options.filter,
	});
}

// ─── prefetchNexusQuery ────────────────────────────────────────────────────────

export interface PrefetchContractOptions<_T = Record<string, unknown>>
	extends ContractQueryOptionsParams {
	type: "contracts";
}

export interface PrefetchInterfaceOptions<
	_TView = Record<string, unknown>,
	_TPayload = Record<string, unknown>,
> extends InterfaceQueryOptionsParams {
	type: "interfaces";
}

/**
 * Prefetch active contracts into a TanStack `QueryClient` for SSR dehydration.
 *
 * Uses the same query key as `useContracts()` so the client immediately reads
 * from cache without a second fetch after hydration.
 *
 * @example
 * ```tsx
 * // app/page.tsx  (Server Component)
 * import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
 * import { createServerNexusClient, prefetchNexusQuery } from "@nexus-framework/react/server";
 *
 * export default async function Page() {
 *   const queryClient = new QueryClient();
 *   const nexus = await createServerNexusClient({ request: ..., config: ... });
 *
 *   await prefetchNexusQuery(queryClient, nexus, {
 *     type: "contracts",
 *     templateId: "pkg:Mod:MultisigWallet",
 *     parties: ["Alice::abc"],
 *   });
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <WalletList />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 */
export async function prefetchNexusQuery<T = Record<string, unknown>>(
	queryClient: QueryClient,
	client: NexusClient,
	options: PrefetchContractOptions<T>,
): Promise<void>;
export async function prefetchNexusQuery<
	TView = Record<string, unknown>,
	TPayload = Record<string, unknown>,
>(
	queryClient: QueryClient,
	client: NexusClient,
	options: PrefetchInterfaceOptions<TView, TPayload>,
): Promise<void>;
export async function prefetchNexusQuery(
	queryClient: QueryClient,
	client: NexusClient,
	options: PrefetchContractOptions | PrefetchInterfaceOptions,
): Promise<void> {
	if (options.type === "contracts") {
		const { type: _type, ...params } = options;
		await queryClient.prefetchQuery(contractQueryOptions({ client, ...params }));
	} else {
		const { type: _type, ...params } = options as PrefetchInterfaceOptions;
		await queryClient.prefetchQuery(interfaceQueryOptions({ client, ...params }));
	}
}
