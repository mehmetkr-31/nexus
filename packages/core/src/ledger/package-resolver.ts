import type { CantonClient } from "../client/canton-client.ts";

export interface TemplateDescriptor {
	packageName: string;
	moduleName: string;
	entityName: string;
}

/**
 * Resolves template names to full Package IDs by querying the participant node.
 * Caches results to avoid redundant API calls.
 */
export class PackageResolver {
	private readonly client: CantonClient;
	private packageCache: Map<string, string[]> = new Map(); // packageName -> [packageId1, packageId2, ...]
	private templateCache: Map<string, string> = new Map(); // "pkg:mod:entity" -> "packageId:mod:entity"
	private isInitialized = false;

	constructor(client: CantonClient) {
		this.client = client;
	}

	/**
	 * Pre-fetches all packages and their metadata to build the local name-to-ID mapping.
	 */
	async init(): Promise<void> {
		if (this.isInitialized === true) return;

		const packageIds = await this.client.listPackages();

		for (const pkgId of packageIds) {
			try {
				const metadata = (await this.client.getPackage(pkgId)) as {
					package_name?: string;
					name?: string;
					modules?: Array<{
						name: string;
						templates: Array<{ name: string }>;
					}>;
				};
				const packageName = metadata.package_name || metadata.name;

				if (packageName) {
					const existing = this.packageCache.get(packageName) || [];
					this.packageCache.set(packageName, [...existing, pkgId]);
				}

				// Index templates in this package
				const modules = metadata.modules || [];
				for (const mod of modules) {
					const modName = mod.name;
					const templates = mod.templates || [];
					for (const tmpl of templates) {
						const tmplName = tmpl.name;
						const key = `${packageName}:${modName}:${tmplName}`;
						this.templateCache.set(key, `${pkgId}:${modName}:${tmplName}`);
					}
				}
			} catch (err) {
				console.warn(`[Nexus] Failed to fetch metadata for package ${pkgId}:`, err);
			}
		}

		this.isInitialized = true;
	}

	/**
	 * Resolves a template name to a full Template ID (including Package ID).
	 * Falls back to the name as-is if no resolution is found.
	 */
	async resolveTemplateId(descriptor: TemplateDescriptor | string): Promise<string> {
		if (typeof descriptor === "string") {
			// If it's already a full ID (contains a colon and is 64 chars long hex + others), return it
			if (descriptor.includes(":") && (descriptor.split(":")[0]?.length ?? 0) >= 64) {
				return descriptor;
			}
			return descriptor;
		}

		if (!this.isInitialized) {
			await this.init();
		}

		const { packageName, moduleName, entityName } = descriptor;
		const key = `${packageName}:${moduleName}:${entityName}`;
		const resolved = this.templateCache.get(key);

		if (!resolved) {
			console.warn(`[Nexus] Could not resolve template: ${key}. Using name only.`);
			return `${packageName}:${moduleName}:${entityName}`;
		}

		return resolved;
	}

	/** Clear caches and force a re-fetch on next use */
	reset(): void {
		this.packageCache.clear();
		this.templateCache.clear();
		this.isInitialized = false;
	}
}
