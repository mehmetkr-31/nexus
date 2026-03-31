import { NexusAuthError, SessionManager } from "@nexus-framework/core";
import type { ServerNexusConfig } from "./server-client.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LedgerRouteHandlerConfig extends ServerNexusConfig {
	/**
	 * The path prefix where this handler is mounted in your Next.js app.
	 * Stripped before forwarding to Canton.
	 *
	 * @example
	 * // Route file: app/api/ledger/[...path]/route.ts
	 * // Canton path: /api/ledger/v2/state/ledger-end → /v2/state/ledger-end
	 * mountPath: "/api/ledger"
	 */
	mountPath: string;
	/**
	 * Allowlist of Canton path prefixes. If provided, requests to any other
	 * path are rejected with 403. Useful for exposing read-only endpoints only.
	 *
	 * @example
	 * allowedPaths: ["/v2/state/", "/v2/packages"]
	 */
	allowedPaths?: string[];
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
 * @example
 * ```ts
 * // app/api/ledger/[...path]/route.ts
 * import { createLedgerRouteHandler } from "@nexus-framework/react/server";
 *
 * const handler = createLedgerRouteHandler({
 *   ledgerApiUrl: process.env.CANTON_API_URL!,
 *   sessionEncryptionKey: process.env.SESSION_KEY,
 *   mountPath: "/api/ledger",
 * });
 *
 * export const GET = handler;
 * export const POST = handler;
 * ```
 */
export function createLedgerRouteHandler(
	config: LedgerRouteHandlerConfig,
): LedgerRouteHandler {
	const sessionMgr = new SessionManager({
		encryptionKey: config.sessionEncryptionKey,
		cookieName: config.sessionCookieName,
		secure: process.env.NODE_ENV === "production",
	});

	const baseUrl = config.ledgerApiUrl.replace(/\/$/, "");
	const mountPath = config.mountPath.replace(/\/$/, "");

	return async function ledgerRouteHandler(req: Request): Promise<Response> {
		// ── 1. Auth ───────────────────────────────────────────────────────────
		let token: string;
		try {
			const session = await sessionMgr.requireSession(req);
			token = session.token;
		} catch (err) {
			const message = err instanceof NexusAuthError ? err.message : "Unauthorized";
			return jsonError(message, 401);
		}

		// ── 2. Path extraction ────────────────────────────────────────────────
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

		// ── 3. Allowlist ──────────────────────────────────────────────────────
		if (
			config.allowedPaths &&
			config.allowedPaths.length > 0 &&
			!config.allowedPaths.some((p) => cantonPath.startsWith(p))
		) {
			return jsonError(`Path not permitted: ${cantonPath}`, 403);
		}

		// ── 4. Forward to Canton ──────────────────────────────────────────────
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

		// ── 5. Stream response back ───────────────────────────────────────────
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
	};
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
