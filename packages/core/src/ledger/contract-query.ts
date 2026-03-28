import type { CantonClient } from "../client/canton-client.ts";
import type {
	ActiveContract,
	ActiveContractsResponse,
	ActiveInterface,
	ActiveInterfacesResponse,
} from "../types/index.ts";

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

	/**
	 * Fetch a contract by its Daml contract key.
	 * Fetches all contracts for the template and finds the one matching the key.
	 * Returns undefined if not found.
	 *
	 * @param templateId - Daml template ID
	 * @param keyPredicate - Function to test if a contract's payload matches the desired key
	 * @param parties - Party IDs to query as
	 */
	async fetchContractByKey<T = Record<string, unknown>>(
		templateId: string,
		keyPredicate: (payload: T) => boolean,
		parties?: string[],
	): Promise<ActiveContract<T> | undefined> {
		const all = await this.fetchAllActiveContracts<T>({ templateId, parties });
		return all.find((c) => keyPredicate(c.payload));
	}

	/**
	 * Fetch the first page of active contracts viewed through a Daml interface.
	 */
	async fetchActiveInterfaces<
		TView = Record<string, unknown>,
		TPayload = Record<string, unknown>,
	>(options: {
		interfaceId: string;
		parties?: string[];
		pageSize?: number;
		includeCreateArguments?: boolean;
	}): Promise<ActiveInterfacesResponse<TView, TPayload>> {
		return this.client.queryByInterface<TView, TPayload>(options.interfaceId, {
			parties: options.parties,
			pageSize: options.pageSize,
			includeCreateArguments: options.includeCreateArguments,
		});
	}

	/**
	 * Fetch ALL active interfaces by following pagination cursors.
	 */
	async fetchAllActiveInterfaces<
		TView = Record<string, unknown>,
		TPayload = Record<string, unknown>,
	>(options: {
		interfaceId: string;
		parties?: string[];
		pageSize?: number;
		includeCreateArguments?: boolean;
	}): Promise<ActiveInterface<TView, TPayload>[]> {
		const contracts: ActiveInterface<TView, TPayload>[] = [];
		let pageToken: string | undefined;

		do {
			const page = await this.client.queryByInterface<TView, TPayload>(options.interfaceId, {
				parties: options.parties,
				pageSize: options.pageSize ?? 100,
				pageToken,
				includeCreateArguments: options.includeCreateArguments,
			});
			contracts.push(...page.contracts);
			pageToken = page.nextPageToken;
		} while (pageToken);

		return contracts;
	}
}
