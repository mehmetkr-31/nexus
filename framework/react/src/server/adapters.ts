import { NexusAuthError } from "@nexus-framework/core";
import type { SessionManager } from "@nexus-framework/core";
import type { NexusServer } from "@nexus-framework/core/server";
import type { DamlTemplate } from "@nexus-framework/core";
import type { NexusPlugin } from "@nexus-framework/core";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NexusAdapterConfig {
	/**
	 * Canton JSON Ledger API URL.
	 */
	ledgerApiUrl: string;
	/**
	 * Mount path prefix to strip before forwarding to Canton.
	 * @example "/api/ledger"
	 */
	mountPath?: string;
	/**
	 * Allowlist of /v2/ path prefixes. Requests outside this list get 403.
	 * @example ["/v2/state/", "/v2/commands/"]
	 */
	allowedPaths?: string[];
	/**
	 * Session manager for extracting auth tokens from cookies.
	 */
	sessionManager: SessionManager;
	timeoutMs?: number;
}

// ─── createHonoLedgerMiddleware ───────────────────────────────────────────────

/**
 * Creates a Hono middleware that proxies requests to the Canton Ledger API,
 * injecting the authenticated user's JWT from the session cookie.
 *
 * Mount on a catch-all route to expose Canton endpoints to the browser.
 *
 * @example
 * ```ts
 * import { Hono } from "hono"
 * import { createHonoLedgerMiddleware } from "@nexus-framework/react/server"
 * import { sessionManager } from "~/lib/nexus"
 *
 * const app = new Hono()
 *
 * app.all(
 *   "/api/ledger/*",
 *   createHonoLedgerMiddleware({
 *     ledgerApiUrl: process.env.CANTON_API_URL!,
 *     mountPath: "/api/ledger",
 *     sessionManager,
 *   })
 * )
 * ```
 */
export function createHonoLedgerMiddleware(config: NexusAdapterConfig) {
	const handler = _createProxyHandler(config);

	// biome-ignore lint/suspicious/noExplicitAny: Hono generics are complex — caller types correctly
	return async (c: any) => {
		const req: Request = c.req.raw;
		const res = await handler(req);
		return res;
	};
}

// ─── createHonoLedgerRoutes ───────────────────────────────────────────────────

/**
 * Returns a Hono `app` instance with Canton proxy routes pre-mounted.
 * Use with `app.route("/api/ledger", createHonoLedgerRoutes(...))`.
 *
 * @example
 * ```ts
 * import { Hono } from "hono"
 * import { createHonoLedgerRoutes } from "@nexus-framework/react/server"
 *
 * const ledgerRoutes = createHonoLedgerRoutes({ ledgerApiUrl: ..., sessionManager })
 * const app = new Hono()
 * app.route("/api/ledger", ledgerRoutes)
 * ```
 */
export function createHonoLedgerRoutes(config: NexusAdapterConfig) {
	// We dynamically import Hono to avoid making it a hard dependency.
	// Callers must have hono installed.
	// biome-ignore lint/suspicious/noExplicitAny: lazy Hono import
	let _Hono: any;
	const handler = _createProxyHandler({ ...config, mountPath: config.mountPath ?? "" });

	// Return a factory function that returns a Hono app when called
	// This avoids the async import at module level
	return {
		/** Register routes on an existing Hono app. */
		// biome-ignore lint/suspicious/noExplicitAny: Hono app type — no hard dep on hono package
		mount(app: any) {
			// biome-ignore lint/suspicious/noExplicitAny: Hono context type
			app.all("/*", async (c: any) => {
				const req: Request = c.req.raw;
				const res = await handler(req);
				return res;
			});
			return app;
		},
		/** Raw Web handler — use if you prefer manual mounting. */
		handle: handler,
	};
}

// ─── createTanStackServerFnHandler ───────────────────────────────────────────

/**
 * Creates a TanStack Start `createServerFn` compatible handler that
 * returns a typed ledger context from a request's session cookie.
 *
 * @example
 * ```ts
 * // app/functions/ledger.ts
 * import { createServerFn } from "@tanstack/start"
 * import { createTanStackLedgerContext } from "@nexus-framework/react/server"
 * import { nexus } from "~/lib/nexus"
 *
 * export const getLedgerContext = createServerFn({ method: "GET" }).handler(
 *   createTanStackLedgerContext(nexus)
 * )
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: NexusServer generics are complex — inference is correct at call site
export function createTanStackLedgerContext(nexus: any) {
	return async ({ request }: { request: Request }) => {
		return nexus.forRequest(request);
	};
}

// ─── Shared Canton proxy handler ──────────────────────────────────────────────

function _createProxyHandler(config: NexusAdapterConfig) {
	const baseUrl = config.ledgerApiUrl.replace(/\/$/, "");
	const mountPath = (config.mountPath ?? "").replace(/\/$/, "");

	return async function cantonProxyHandler(req: Request): Promise<Response> {
		// 1. Auth
		let token: string;
		try {
			const session = await config.sessionManager.requireSession(req);
			token = session.token;
		} catch (err) {
			const message = err instanceof NexusAuthError ? err.message : "Unauthorized";
			return _jsonError(message, 401);
		}

		// 2. Path
		const url = new URL(req.url);
		let cantonPath = url.pathname;
		if (mountPath && cantonPath.startsWith(mountPath)) {
			cantonPath = cantonPath.slice(mountPath.length);
		}
		if (!cantonPath.startsWith("/")) cantonPath = `/${cantonPath}`;

		if (!cantonPath.startsWith("/v2/") && cantonPath !== "/v2") {
			return _jsonError(`Path must begin with /v2/. Got: ${cantonPath}`, 400);
		}

		// 3. Allowlist
		if (config.allowedPaths?.length && !config.allowedPaths.some((p) => cantonPath.startsWith(p))) {
			return _jsonError(`Path not permitted: ${cantonPath}`, 403);
		}

		// 4. Forward
		const targetUrl = `${baseUrl}${cantonPath}${url.search}`;
		const fwdHeaders = new Headers();
		fwdHeaders.set("Authorization", `Bearer ${token}`);
		const ct = req.headers.get("Content-Type");
		if (ct) fwdHeaders.set("Content-Type", ct);

		const method = req.method.toUpperCase();
		const hasBody = method === "POST" || method === "PUT" || method === "PATCH";

		let upstreamRes: Response;
		try {
			upstreamRes = await fetch(targetUrl, {
				method,
				headers: fwdHeaders,
				body: hasBody ? await req.arrayBuffer() : undefined,
				signal: AbortSignal.timeout(config.timeoutMs ?? 30_000),
			});
		} catch (err) {
			return _jsonError(`Canton unreachable: ${String(err)}`, 502);
		}

		// 5. Stream response back
		const resHeaders = new Headers();
		for (const [k, v] of upstreamRes.headers.entries()) {
			const lower = k.toLowerCase();
			if (["transfer-encoding", "connection", "keep-alive", "upgrade"].includes(lower)) continue;
			resHeaders.set(k, v);
		}

		return new Response(upstreamRes.body, {
			status: upstreamRes.status,
			statusText: upstreamRes.statusText,
			headers: resHeaders,
		});
	};
}

function _jsonError(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
