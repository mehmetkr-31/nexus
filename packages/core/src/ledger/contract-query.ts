import type { CantonClient } from "../client/canton-client.ts";
import type { ActiveContract, ActiveContractsResponse, TemplateId } from "../types/index.ts";

export interface ContractQueryOptions<_T = Record<string, unknown>> {
	/** Daml template ID — either "packageId:Module:Entity" or TemplateId object */
	templateId: string | TemplateId;
	/** Party IDs to query as */
	parties?: string[];
	/** Optional payload-level filter */
	filter?: Record<string, unknown>;
	/** Page size for pagination */
	pageSize?: number;
	/** Page token for pagination */
	pageToken?: string;
}

// ─── ContractQuery ────────────────────────────────────────────────────────────

export class ContractQuery {
	constructor(private readonly client: CantonClient) {}

	/**
	 * Fetch a page of active contracts matching the given template.
	 */
	async fetchActiveContracts<T = Record<string, unknown>>(
		options: ContractQueryOptions<T>,
	): Promise<ActiveContractsResponse<T>> {
		return this.client.queryContracts<T>(options.templateId, {
			parties: options.parties,
			filter: options.filter,
			pageSize: options.pageSize,
			pageToken: options.pageToken,
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
		const result = await this.client.queryContracts<T>(templateId, {
			parties,
			pageSize: 1000,
		});
		return result.contracts.find((c) => c.contractId === contractId);
	}

	/**
	 * Fetch a contract by its Daml contract key.
	 * Fetches all contracts for the template and finds the one matching the key.
	 * Returns undefined if not found.
	 */
	async fetchContractByKey<T = Record<string, unknown>>(
		templateId: string,
		keyPredicate: (payload: T) => boolean,
		parties?: string[],
	): Promise<ActiveContract<T> | undefined> {
		const all = await this.fetchAllActiveContracts<T>({ templateId, parties });
		return all.find((c) => keyPredicate(c.payload));
	}
}
