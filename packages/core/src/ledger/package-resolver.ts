import type { CantonClient } from "../client/canton-client.ts";

export interface TemplateDescriptor {
	packageName: string;
	moduleName: string;
	entityName: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves template names to full Package IDs by querying the participant node.
 * Caches results to avoid redundant API calls.
 */
export class PackageResolver {
	private readonly client: CantonClient;
	private packageCache: Map<string, string[]> = new Map(); // packageName -> [packageId1, packageId2, ...]
	private templateCache: Map<string, string> = new Map(); // "pkg:mod:entity" -> "packageId:mod:entity"
	private isInitialized = false;
	private initPromise: Promise<void> | null = null;

	constructor(client: CantonClient) {
		this.client = client;
	}

	/**
	 * Pre-fetches all packages and their metadata to build the local name-to-ID mapping.
	 */
	async init(): Promise<void> {
		if (this.isInitialized) return;
		if (this.initPromise) return this.initPromise;

		this.initPromise = this.internalInit().finally(() => {
			this.initPromise = null;
		});

		return this.initPromise;
	}

	/**
	 * Extracts the package name from raw DALF bytes using protobuf scanning.
	 * Canton encodes the package name as: 0x12 <varint len> <name bytes> 0x12 <varint len> <semver bytes>
	 * We scan for a UTF-8 string that looks like a package name followed by a semver version.
	 */
	private extractPackageName(bytes: Uint8Array): string | null {
		const semverRe = /^\d+\.\d+\.\d+$/;
		// Scan for 0x12 <len> <name> 0x12 <len> <semver>
		for (let i = 0; i < bytes.length - 4; i++) {
			if (bytes[i] !== 0x12) continue;
			const nameLen = bytes[i + 1];
			if (!nameLen || nameLen > 128 || i + 2 + nameLen >= bytes.length) continue;
			const nameBytes = bytes.slice(i + 2, i + 2 + nameLen);
			// Must be printable ASCII (package names are alphanumeric + hyphens/dots)
			const name = String.fromCharCode(...nameBytes);
			if (!/^[a-zA-Z0-9][\w.-]*$/.test(name)) continue;
			// Next field must also be 0x12 <len> <semver>
			const j = i + 2 + nameLen;
			if (bytes[j] !== 0x12) continue;
			const verLen = bytes[j + 1];
			if (!verLen || verLen > 32 || j + 2 + verLen > bytes.length) continue;
			const verBytes = bytes.slice(j + 2, j + 2 + verLen);
			const ver = String.fromCharCode(...verBytes);
			if (semverRe.test(ver)) return name;
		}
		return null;
	}

	/**
	 * The actual initialization logic with full error handling and retries.
	 * Ensured to never reject to prevent 'unhandledRejection' in browsers.
	 */
	private async internalInit(): Promise<void> {
		const maxAttempts = 3;
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const packageIds = await this.client.listPackages();

				for (const pkgId of packageIds) {
					try {
						const dalf = await this.client.getPackageBytes(pkgId);
						const packageName = this.extractPackageName(dalf) ?? pkgId;

						const existing = this.packageCache.get(packageName) || [];
						if (!existing.includes(pkgId)) {
							this.packageCache.set(packageName, [...existing, pkgId]);
						}

						// We can't extract template names from DALF binary cheaply,
						// but we can build a prefix cache: "pkgName:*" -> pkgId
						// resolveTemplateId handles the suffix passthrough.
					} catch (err) {
						console.warn(`[Nexus] Failed to fetch DALF for package ${pkgId.slice(0, 8)}...:`, err);
					}
				}

				this.isInitialized = true;
				return;
			} catch (err: unknown) {
				const error = err as Error & { code?: string };
				lastError = error;
				const isNetworkError =
					error.message?.includes("fetch failed") ||
					error.message?.includes("Failed to fetch") ||
					error.code === "ECONNREFUSED";

				if (isNetworkError && attempt < maxAttempts) {
					const delay = 1000 * 2 ** (attempt - 1);
					console.warn(
						`[Nexus] Sandbox not ready (Attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`,
					);
					await sleep(delay);
					continue;
				}
				break;
			}
		}

		console.warn(
			`[Nexus] Package discovery failed: ${lastError?.message || String(lastError)}. Using fallback resolution.`,
		);
	}

	/**
	 * Resolves a template name to a full Template ID (including Package ID).
	 * Falls back to the name as-is if no resolution is found.
	 */
	async resolveTemplateId(descriptor: TemplateDescriptor | string): Promise<string> {
		if (!this.isInitialized) {
			await this.init();
		}

		if (typeof descriptor === "string") {
			// Already a full hex ID (64+ char package ID prefix)
			if (descriptor.includes(":") && (descriptor.split(":")[0]?.length ?? 0) >= 64) {
				return descriptor;
			}
			// Try to resolve "packageName:Module:Entity" -> "hexId:Module:Entity"
			const parts = descriptor.split(":");
			if (parts.length === 3) {
				const [pkgName, mod, entity] = parts;
				const ids = pkgName ? this.packageCache.get(pkgName) : undefined;
				if (ids && ids.length > 0) {
					// Use the most recently uploaded version (last in list)
					return `${ids[ids.length - 1]}:${mod}:${entity}`;
				}
			}
			return descriptor;
		}

		const { packageName, moduleName, entityName } = descriptor;
		const ids = this.packageCache.get(packageName);
		if (ids && ids.length > 0) {
			return `${ids[ids.length - 1]}:${moduleName}:${entityName}`;
		}

		console.debug(`[Nexus] Could not resolve template: ${packageName}:${moduleName}:${entityName}. Using name only.`);
		return `${packageName}:${moduleName}:${entityName}`;
	}

	/** Returns all discovered templates as a mapping of Human Readable Name -> Package ID Name */
	getAllTemplates(): Record<string, string> {
		const result: Record<string, string> = {};
		for (const [key, value] of this.templateCache.entries()) {
			result[key] = value;
		}
		return result;
	}

	/** Clear caches and force a re-fetch on next use */
	reset(): void {
		this.packageCache.clear();
		this.templateCache.clear();
		this.isInitialized = false;
	}
}
