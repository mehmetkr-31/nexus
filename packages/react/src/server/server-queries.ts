import type { ActiveContractsResponse, NexusClient } from "@nexus-framework/core";

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
