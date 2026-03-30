import type { CantonClient } from "../client/canton-client.ts";
import type {
	ActiveContract,
	ActiveContractsResponse,
	TemplateDescriptor,
	TemplateId,
} from "../types/index.ts";
import { fetchAllPages } from "../utils/pagination.ts";
import type { PackageResolver } from "./package-resolver.ts";

export interface ContractQueryOptions<_T = Record<string, unknown>> {
	/** Daml template ID — "packageId:Module:Entity", TemplateId object, or TemplateDescriptor */
	templateId: string | TemplateId | TemplateDescriptor;
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
	constructor(
		private readonly client: CantonClient,
		private readonly packages?: PackageResolver,
	) {}

	private async resolve(t: string | TemplateId | TemplateDescriptor): Promise<string | TemplateId> {
		if (this.packages && typeof t === "object" && "packageName" in t) {
			return this.packages.resolveTemplateId(t);
		}
		return t as string | TemplateId;
	}

	/**
	 * Fetch a page of active contracts matching the given template.
	 */
	async fetchActiveContracts<T = Record<string, unknown>>(
		options: ContractQueryOptions<T>,
	): Promise<ActiveContractsResponse<T>> {
		const templateId = await this.resolve(options.templateId);
		return this.client.queryContracts<T>(templateId, {
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
		const templateId = await this.resolve(options.templateId);

		return fetchAllPages(async (pageToken) => {
			const page = await this.client.queryContracts<T>(templateId, {
				parties: options.parties,
				filter: options.filter,
				pageSize: options.pageSize ?? 100,
				pageToken,
			});
			return { items: page.contracts, nextPageToken: page.nextPageToken };
		});
	}

	/**
	 * Fetch a single contract by contractId from active contracts.
	 * Returns undefined if not found.
	 */
	async fetchContractById<T = Record<string, unknown>>(
		templateId: string | TemplateDescriptor | TemplateId,
		contractId: string,
		parties?: string[],
	): Promise<ActiveContract<T> | undefined> {
		const resolvedId = await this.resolve(templateId);
		const result = await this.client.queryContracts<T>(resolvedId, {
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
		templateId: string | TemplateDescriptor | TemplateId,
		keyPredicate: (payload: T) => boolean,
		parties?: string[],
	): Promise<ActiveContract<T> | undefined> {
		const all = await this.fetchAllActiveContracts<T>({ templateId, parties });
		return all.find((c) => keyPredicate(c.payload));
	}
}
