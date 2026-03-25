import type { CantonClient } from "../client/canton-client.ts";
import type { ActiveContract, ActiveContractsResponse } from "../types/index.ts";

export interface ContractQueryOptions<_T = Record<string, unknown>> {
	/** Daml template ID — either "packageId:Module:Entity" or TemplateId object */
	templateId: string;
	/** Party IDs to query as */
	parties?: string[];
	/** Optional payload-level filter */
	filter?: Record<string, unknown>;
	/** Page size for pagination */
	pageSize?: number;
}

// ─── ContractQuery ────────────────────────────────────────────────────────────

export class ContractQuery {
	constructor(private readonly client: CantonClient) {}

	/**
	 * Fetch the first page of active contracts matching the given template.
	 */
	async fetchActiveContracts<T = Record<string, unknown>>(
		options: ContractQueryOptions<T>,
	): Promise<ActiveContractsResponse<T>> {
		return this.client.queryContracts<T>(options.templateId, {
			parties: options.parties,
			filter: options.filter,
			pageSize: options.pageSize,
		});
	}

	/**
	 * Fetch ALL active contracts by following pagination cursors.
	 * Use with care on large datasets.
	 */
	async fetchAllActiveContracts<T = Record<string, unknown>>(
		options: ContractQueryOptions<T>,
	): Promise<ActiveContract<T>[]> {
		const contracts: ActiveContract<T>[] = [];
		let pageToken: string | undefined;

		do {
			const page = await this.client.queryContracts<T>(options.templateId, {
				parties: options.parties,
				filter: options.filter,
				pageSize: options.pageSize ?? 100,
				pageToken,
			});
			contracts.push(...page.contracts);
			pageToken = page.nextPageToken;
		} while (pageToken);

		return contracts;
	}

	/**
	 * Fetch a single contract by contractId from active contracts.
	 * Returns undefined if not found.
	 */
	async fetchContractById<T = Record<string, unknown>>(
		templateId: string,
		contractId: string,
		parties?: string[],
	): Promise<ActiveContract<T> | undefined> {
		// Canton JSON API doesn't have a direct "get by contractId" endpoint in v2;
		// query and filter client-side within the page results.
		const result = await this.client.queryContracts<T>(templateId, {
			parties,
			pageSize: 1000,
		});
		return result.contracts.find((c) => c.contractId === contractId);
	}
}
