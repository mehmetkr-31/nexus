/**
 * Sandbox utility functions for multi-user development mode.
 * These helpers extract sandbox user IDs from requests and detect sandbox mode.
 */

/**
 * Extract sandbox user ID from request with priority order:
 * 1. X-Sandbox-User header
 * 2. sandbox_user query parameter
 * 3. sandbox_user cookie
 * 4. null (no user specified)
 *
 * @example
 * ```ts
 * const userId = extractSandboxUserId(req);
 * console.log(userId); // "bob" or "alice" or null
 * ```
 */
export function extractSandboxUserId(req: Request): string | null {
	// 1. Check header (highest priority - used by test automation)
	const headerUser = req.headers.get("X-Sandbox-User");
	if (headerUser) return headerUser;

	// 2. Check query parameter (used by UI dropdowns)
	try {
		const url = new URL(req.url);
		const queryUser = url.searchParams.get("sandbox_user");
		if (queryUser) return queryUser;
	} catch {
		// Invalid URL, continue
	}

	// 3. Check cookie (persistent user selection)
	const cookieHeader = req.headers.get("Cookie");
	if (cookieHeader) {
		const match = cookieHeader.match(/sandbox_user=([^;]+)/);
		if (match?.[1]) return match[1];
	}

	return null;
}

/**
 * Check if a NexusServer is running in sandbox mode.
 * Detects the presence of the sandbox-auth plugin.
 *
 * @internal Used by createLedgerRouteHandler for auto-detection
 */
export function isSandboxMode(authPlugin: unknown): boolean {
	if (!authPlugin || typeof authPlugin !== "object") return false;
	return "id" in authPlugin && authPlugin.id === "sandbox-auth";
}

/**
 * Extract sandbox auth options from a plugin.
 *
 * @internal Used by createLedgerRouteHandler
 */
export function getSandboxOptions(authPlugin: unknown): {
	getUserId?: (context: { headers: Headers; url: string }) => string | Promise<string>;
	secret: string;
} | null {
	if (!authPlugin || typeof authPlugin !== "object") return null;
	if (!("$Infer" in authPlugin)) return null;

	const infer = authPlugin.$Infer as any;
	if (infer?.sandboxOptions) {
		return infer.sandboxOptions;
	}

	return null;
}
