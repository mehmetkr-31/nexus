import { NexusAuthError, SessionManager } from "@nexus-framework/core";
import type { NexusServer } from "@nexus-framework/core/server";
import type { ServerNexusConfig } from "./server-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SandboxAutoProvisionConfig {
	/**
	 * Enable/disable auto-provisioning. If not specified, auto-detected from nexusServer.
	 * When enabled, requests without a session automatically provision a sandbox user.
	 */
	enabled?: boolean;

	/**
	 * Extract user ID from request. Priority order:
	 * 1. X-Sandbox-User header
	 * 2. sandbox_user query parameter
	 * 3. Returns default "alice"
	 */
	getUserId?: (req: Request) => string | Promise<string>;

	/**
	 * HMAC secret for sandbox tokens.
	 * Defaults to the secret from sandboxAuth plugin if nexusServer is provided.
	 */
	secret?: string;

	/**
	 * Ledger API URL for provisioning.
	 * Defaults to config.ledgerApiUrl.
	 */
	ledgerApiUrl?: string;
}

export interface LedgerRouteHandlerConfig {
	/** Canton JSON Ledger API URL */
	ledgerApiUrl: string;
	/**
	 * The path prefix where this handler is mounted.
	 * Stripped before forwarding to Canton.
	 * @example "/api/ledger"
	 */
	mountPath: string;
	/**
	 * Allowlist of Canton path prefixes.
	 * @example ["/v2/state/", "/v2/packages"]
	 */
	allowedPaths?: string[];
	/**
	 * Provide an existing SessionManager instance (preferred).
	 * If not provided, one will be created from `sessionEncryptionKey`.
	 */
	sessionManager?: SessionManager;
	/** AES-GCM encryption key for session cookies (used when sessionManager is not provided) */
	sessionEncryptionKey?: string;
	/** Cookie name override */
	sessionCookieName?: string;

	/**
	 * Optional: NexusServer instance for auto-detecting sandbox mode.
	 * When a sandboxAuth plugin is detected, auto-provisioning is automatically enabled.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: NexusServer generic types are not needed here
	nexusServer?: NexusServer<any, any>;

	/**
	 * Sandbox auto-provision configuration.
	 * When enabled, missing sessions trigger automatic user provisioning in development mode.
	 * Auto-detected if nexusServer is provided with sandboxAuth plugin.
	 */
	sandbox?: SandboxAutoProvisionConfig;
}

/** Next.js App Router compatible request handler */
export type LedgerRouteHandler = (req: Request) => Promise<Response>;

// ─── createLedgerRouteHandler ─────────────────────────────────────────────────

/**
 * Creates a Next.js App Router API route handler that proxies requests to the
 * Canton JSON Ledger API, injecting the authenticated user's JWT.
 *
 * Mount in a catch-all route (`app/api/ledger/[...path]/route.ts`) to forward
 * all `/api/ledger/v2/...` paths to the participant node while keeping the JWT
 * server-side (B2B pattern).
 *
 * **Sandbox Auto-Provisioning:**
 * When `nexusServer` with `sandboxAuth` plugin is provided, or `sandbox.enabled` is true,
 * requests without a session automatically provision a sandbox user and create a session cookie.
 * This provides a production-like multi-user development experience.
 *
 * @example Basic usage (production mode)
 * ```ts
 * const handler = createLedgerRouteHandler({
 *   ledgerApiUrl: process.env.CANTON_API_URL!,
 *   sessionEncryptionKey: process.env.SESSION_KEY,
 *   mountPath: "/api/ledger",
 * });
 * export const GET = handler;
 * export const POST = handler;
 * ```
 *
 * @example Sandbox mode with auto-provision
 * ```ts
 * const handler = createLedgerRouteHandler({
 *   ledgerApiUrl: process.env.CANTON_API_URL!,
 *   mountPath: "/api/ledger",
 *   sessionManager,
 *   nexusServer: nexus, // Auto-detects sandboxAuth plugin
 * });
 * ```
 *
 * @example Multi-user sandbox with custom user resolver
 * ```ts
 * const handler = createLedgerRouteHandler({
 *   ledgerApiUrl: process.env.CANTON_API_URL!,
 *   mountPath: "/api/ledger",
 *   sessionManager,
 *   sandbox: {
 *     enabled: true,
 *     getUserId: (req) => req.headers.get('X-Sandbox-User') ?? 'alice',
 *     secret: process.env.SANDBOX_SECRET!,
 *   }
 * });
 * ```
 */
export function createLedgerRouteHandler(config: LedgerRouteHandlerConfig): LedgerRouteHandler {
	// Prefer an externally provided SessionManager (shares state with the app).
	// Fall back to creating a new one from config keys.
	const sessionMgr =
		config.sessionManager ??
		new SessionManager({
			encryptionKey: config.sessionEncryptionKey,
			cookieName: config.sessionCookieName,
			secure: process.env.NODE_ENV === "production",
		});

	const baseUrl = config.ledgerApiUrl.replace(/\/$/, "");
	const mountPath = config.mountPath.replace(/\/$/, "");

	// Detect sandbox mode and setup auto-provision configuration
	const sandboxConfig = detectSandboxConfig(config);

	return async function ledgerRouteHandler(req: Request): Promise<Response> {
		// ── 1. Auth ───────────────────────────────────────────────────────────
		let token: string | undefined;
		let shouldProvision = false;

		try {
			const session = await sessionMgr.requireSession(req);
			token = session.token;
		} catch (err) {
			// No valid session - check if we should auto-provision
			if (sandboxConfig?.enabled) {
				shouldProvision = true;
			} else {
				const message = err instanceof NexusAuthError ? err.message : "Unauthorized";
				return jsonError(message, 401);
			}
		}

		// ── 2. Auto-Provision (Sandbox Mode) ──────────────────────────────────
		if (shouldProvision && sandboxConfig) {
			try {
				const result = await autoProvisionSandboxSession(req, sandboxConfig, sessionMgr);
				token = result.token;

				// Continue with the request, but we'll inject Set-Cookie in the response
				const response = await forwardToCantonWithAuth(req, token, baseUrl, mountPath, config);
				response.headers.append("Set-Cookie", result.cookieValue);

				return response;
			} catch (error) {
				console.error("[Ledger Route] Auto-provisioning failed:", error);
				return jsonError("Failed to auto-provision sandbox user", 500);
			}
		}

		// ── 3. Forward to Canton ──────────────────────────────────────────────
		// At this point token must be defined (either from session or auto-provision)
		if (!token) {
			return jsonError("Unauthorized: no session or auto-provision failed", 401);
		}
		return forwardToCantonWithAuth(req, token, baseUrl, mountPath, config);
	};
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * Detect sandbox configuration from nexusServer or explicit config
 */
function detectSandboxConfig(
	config: LedgerRouteHandlerConfig,
): SandboxAutoProvisionConfig | null {
	// Explicit sandbox config takes precedence
	if (config.sandbox) {
		return {
			enabled: config.sandbox.enabled ?? true,
			getUserId: config.sandbox.getUserId,
			secret: config.sandbox.secret,
			ledgerApiUrl: config.sandbox.ledgerApiUrl ?? config.ledgerApiUrl,
		};
	}

	// Auto-detect from nexusServer
	if (config.nexusServer) {
		// Check if sandboxAuth plugin is present
		const authPlugin = (config.nexusServer as any).client?._authPlugin;
		if (authPlugin?.id === "sandbox-auth") {
			// Extract sandbox options from plugin
			const sandboxOptions = (authPlugin as any).$Infer?.sandboxOptions;
			return {
				enabled: true,
				getUserId: sandboxOptions?.getUserId,
				secret: sandboxOptions?.secret,
				ledgerApiUrl: config.ledgerApiUrl,
			};
		}
	}

	return null;
}

/**
 * Auto-provision a sandbox user and create a session cookie
 */
async function autoProvisionSandboxSession(
	req: Request,
	sandboxConfig: SandboxAutoProvisionConfig,
	sessionManager: SessionManager,
): Promise<{ token: string; cookieValue: string; userId: string; partyId: string }> {
	const { extractSandboxUserId, provisionSandboxUser, sandboxAuth } = await import(
		"@nexus-framework/core"
	);

	// 1. Determine user ID
	let userId: string;
	if (sandboxConfig.getUserId) {
		userId = await sandboxConfig.getUserId(req);
	} else {
		// Use helper to extract from header/query/cookie
		userId = extractSandboxUserId(req) ?? "alice";
	}

	console.log(`[Ledger Route] Auto-provisioning sandbox user: ${userId}`);

	// 2. Provision user in Canton
	const partyId = await provisionSandboxUser({
		ledgerApiUrl: sandboxConfig.ledgerApiUrl!,
		userId,
		secret: sandboxConfig.secret!,
	});

	// 3. Generate token for this user using sandboxAuth plugin
	const authPlugin = sandboxAuth({
		userId,
		secret: sandboxConfig.secret!,
		partyId,
	});
	const token = await authPlugin.auth!.getToken();

	// 4. Create session cookie
	const cookieValue = await sessionManager.createSessionCookie({
		partyId,
		userId,
		token,
	});

	console.log(`[Ledger Route] Session created for ${userId} (${partyId})`);

	return { token, cookieValue, userId, partyId };
}

/**
 * Forward request to Canton with authentication
 */
async function forwardToCantonWithAuth(
	req: Request,
	token: string,
	baseUrl: string,
	mountPath: string,
	config: LedgerRouteHandlerConfig,
): Promise<Response> {
	// ── 1. Path extraction ────────────────────────────────────────────────
	const url = new URL(req.url);
	let cantonPath = url.pathname;
	if (cantonPath.startsWith(mountPath)) {
		cantonPath = cantonPath.slice(mountPath.length);
	}
	if (!cantonPath.startsWith("/")) cantonPath = `/${cantonPath}`;

	// Safety: only forward /v2/ paths
	if (!cantonPath.startsWith("/v2/") && cantonPath !== "/v2") {
		return jsonError(`Path must begin with /v2/. Got: ${cantonPath}`, 400);
	}

	// ── 2. Allowlist ──────────────────────────────────────────────────────
	if (
		config.allowedPaths &&
		config.allowedPaths.length > 0 &&
		!config.allowedPaths.some((p) => cantonPath.startsWith(p))
	) {
		return jsonError(`Path not permitted: ${cantonPath}`, 403);
	}

	// ── 3. Forward to Canton ──────────────────────────────────────────────
	const targetUrl = `${baseUrl}${cantonPath}${url.search}`;

	const fwdHeaders = new Headers();
	fwdHeaders.set("Authorization", `Bearer ${token}`);
	const ct = req.headers.get("Content-Type");
	if (ct) fwdHeaders.set("Content-Type", ct);

	const method = req.method.toUpperCase();
	const hasBody = method === "POST" || method === "PUT" || method === "PATCH";

	let cantonRes: Response;
	try {
		cantonRes = await fetch(targetUrl, {
			method,
			headers: fwdHeaders,
			body: hasBody ? await req.arrayBuffer() : undefined,
			signal: AbortSignal.timeout(30_000),
		});
	} catch (err) {
		return jsonError(`Canton unreachable: ${String(err)}`, 502);
	}

	// ── 4. Stream response back ───────────────────────────────────────────
	const resHeaders = new Headers();
	for (const [k, v] of cantonRes.headers.entries()) {
		const lower = k.toLowerCase();
		if (
			lower === "transfer-encoding" ||
			lower === "connection" ||
			lower === "keep-alive" ||
			lower === "upgrade"
		)
			continue;
		resHeaders.set(k, v);
	}

	return new Response(cantonRes.body, {
		status: cantonRes.status,
		statusText: cantonRes.statusText,
		headers: resHeaders,
	});
}
