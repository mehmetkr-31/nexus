import type { NexusPlugin } from "../types/plugin.ts";
import { PackageResolver } from "./package-resolver.ts";

/**
 * Extension added to the Nexus client by the `packageDiscoveryPlugin`.
 */
export interface PackageDiscoveryActions extends Record<string, unknown> {
	readonly packages: PackageResolver;
}

/**
 * Plugin that enables automatic Package ID resolution.
 *
 * It fetches all packages from the participant node on initialization and
 * builds a mapping that allows using human-readable names instead of hex IDs.
 *
 * @example
 * ```ts
 * const nexus = createNexus({
 *   baseUrl: "...",
 *   plugins: [
 *     sandboxAuth({ ... }),
 *     packageDiscoveryPlugin(),
 *   ],
 * });
 *
 * // Now 'packages' is available on the client:
 * const fullId = await nexus.packages.resolveTemplateId({
 *   packageName: "iou",
 *   moduleName: "Iou",
 *   entityName: "Iou"
 * });
 * ```
 */
export function packageDiscoveryPlugin(): NexusPlugin<PackageDiscoveryActions> {
	return {
		id: "package-discovery",
		init: (client) => {
			const resolver = new PackageResolver(client);
			// Initialization will happen lazily on first resolveTemplateId call
			return { packages: resolver };
		},
	};
}
