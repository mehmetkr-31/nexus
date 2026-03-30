import type { CantonClient } from "../client/canton-client.ts";
import type {
	ActivateInterfaceOptions,
	ActiveInterfacesResponse,
	TemplateDescriptor,
	TemplateId,
} from "../types/index.ts";
import { fetchAllPages } from "../utils/pagination.ts";
import type { PackageResolver } from "./package-resolver.ts";

/**
 * Provides methods for querying active contracts through a Daml interface.
 */
export class InterfaceQuery {
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
	 * Lists active contracts matching a Daml interface.
	 * Returns a paged response.
	 */
	async fetchActiveInterfaces<TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
		options: ActivateInterfaceOptions,
	): Promise<ActiveInterfacesResponse<TView, TPayload>> {
		const interfaceId = await this.resolve(options.interfaceId);
		return this.client.queryByInterface<TView, TPayload>(interfaceId, options);
	}

	/**
	 * Fetches all active contracts for an interface by following all pagination tokens.
	 * Caution: This can be a very large request on production ledgers.
	 */
	async fetchAllActiveInterfaces<
		TView = Record<string, unknown>,
		TPayload = Record<string, unknown>,
	>(
		options: Omit<ActivateInterfaceOptions, "pageToken" | "pageSize">,
	): Promise<ActiveInterfacesResponse<TView, TPayload>["interfaces"]> {
		return fetchAllPages(async (pageToken) => {
			const response = await this.fetchActiveInterfaces<TView, TPayload>({
				...options,
				pageToken,
				pageSize: 100,
			});
			return { items: response.interfaces, nextPageToken: response.nextPageToken };
		});
	}
}
