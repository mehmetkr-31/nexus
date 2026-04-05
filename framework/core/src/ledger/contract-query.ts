import type { CantonClient } from "../client/canton-client.ts";
import type {
	ActiveContract,
	ActiveContractsResponse,
	DamlTemplate,
	DamlTemplateIdentity,
	NexusTemplateIdentifier,
	TemplateDescriptor,
	TemplateId,
} from "../types/index.ts";
import { DEFAULT_PAGE_SIZE } from "../config.ts";
import { fetchAllPages } from "../utils/pagination.ts";
import type { PackageResolver } from "./package-resolver.ts";

export interface ContractQueryOptions<_T = unknown> {
	/** Daml template ID — "packageId:Module:Entity", TemplateId object, TemplateDescriptor, or DamlTemplate */
	templateId: NexusTemplateIdentifier;
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

	private async resolve(t: NexusTemplateIdentifier): Promise<string | TemplateId> {
		if (typeof t === "object" && "templateId" in t && "decoder" in t) {
			// DamlTemplate — use full package-qualified ID when available (v3+), fall back to templateId (v2)
			return (
				(t as DamlTemplateIdentity).templateIdWithPackageId ??
				(t as DamlTemplateIdentity).templateId
			);
		}
		if (this.packages && typeof t === "object" && "packageName" in t) {
			return this.packages.resolveTemplateId(t as TemplateDescriptor);
		}
		return t as string | TemplateId;
	}

	/**
	 * Fetch ALL active contracts for a given template using type inference.
	 * This is the recommended "Root Solution" for type-safe queries.
	 */
	async query<T>(
		template: DamlTemplate<T, unknown, string>,
		options?: Omit<ContractQueryOptions<T>, "templateId">,
	): Promise<ActiveContract<T>[]> {
		return this.fetchAllActiveContracts<T>({
			...options,
			templateId: template,
		});
	}

	/**
	 * Fetch a page of active contracts matching the given template.
	 */
	async fetchActiveContracts<T = unknown>(
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
	async fetchAllActiveContracts<T = unknown>(
		options: ContractQueryOptions<T>,
	): Promise<ActiveContract<T>[]> {
		const templateId = await this.resolve(options.templateId);

		return fetchAllPages(async (pageToken) => {
			const page = await this.client.queryContracts<T>(templateId, {
				parties: options.parties,
				filter: options.filter,
				pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
				pageToken,
			});
			return { items: page.contracts, nextPageToken: page.nextPageToken };
		});
	}

	/**
	 * Fetch a single contract by contract ID.
	 * Uses the Canton native `POST /v2/contracts/contract-by-id` endpoint —
	 * a single O(1) API call, no client-side filtering.
	 * Returns undefined if the contract does not exist or is not visible.
	 */
	async fetchContractById<T = unknown>(
		contractId: string,
		parties?: string[],
	): Promise<ActiveContract<T> | undefined> {
		return this.client.getContractById<T>(contractId, { parties });
	}

	/**
	 * Fetch a contract by its Daml contract key using the Canton native O(1) endpoint.
	 * Uses `POST /v2/contracts/contract-by-key`.
	 *
	 * The key must be the **exact key value** as a plain JS object matching the Daml key type.
	 * For example, if the Daml key is `(Party -> Text)`, pass `{ owner: "Alice::...", reference: "ref-1" }`.
	 *
	 * Returns `undefined` if no contract has that key or the party can't see it.
	 *
	 * @example
	 * ```ts
	 * const contract = await query.fetchContractByKey<IouPayload>(
	 *   "nexus-example:Iou:Iou",
	 *   { owner: "alice::...123" },
	 *   [partyId],
	 * );
	 * ```
	 */
	async fetchContractByKey<T = unknown>(
		templateId: NexusTemplateIdentifier,
		key: Record<string, unknown>,
		parties?: string[],
	): Promise<ActiveContract<T> | undefined> {
		const resolvedId = await this.resolve(templateId);
		const stableId =
			typeof resolvedId === "string"
				? resolvedId
				: `${resolvedId.packageId}:${resolvedId.moduleName}:${resolvedId.entityName}`;
		return this.client.getContractByKey<T>(stableId, key, { parties });
	}
}
