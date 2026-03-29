import type { CantonClient } from "../client/canton-client.ts";
import type {
	ActivateInterfaceOptions,
	ActiveInterfacesResponse,
	TemplateDescriptor,
	TemplateId,
} from "../types/index.ts";
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
		const results: ActiveInterfacesResponse<TView, TPayload>["interfaces"] = [];
		let pageToken: string | undefined;

		do {
			const response: ActiveInterfacesResponse<TView, TPayload> = await this.fetchActiveInterfaces<
				TView,
				TPayload
			>({
				...options,
				pageToken,
				pageSize: 100,
			});
			results.push(...response.interfaces);
			pageToken = response.nextPageToken;
		} while (pageToken);

		return results;
	}
}
