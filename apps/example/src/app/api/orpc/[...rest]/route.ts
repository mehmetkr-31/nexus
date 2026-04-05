/**
 * oRPC route handler for the example app.
 *
 * Mounts the full appRouter (including Canton ledger procedures) at /api/orpc.
 *
 * Available routes:
 *   POST /api/orpc/healthCheck         → "OK"
 *   POST /api/orpc/me                  → { id, email, name }
 *   POST /api/orpc/iou/list            → ActiveContract[]
 *   POST /api/orpc/iou/get             → ActiveContract | NOT_FOUND
 *   POST /api/orpc/iou/create          → { contractId, payload }
 *   POST /api/orpc/iou/transfer        → SubmitResult
 *   POST /api/orpc/iou/archive         → SubmitResult
 *
 * Client setup (in client components):
 * ```ts
 * import { createORPCClient } from "@orpc/client"
 * import { RPCLink } from "@orpc/client/fetch"
 * import type { AppRouter } from "~/lib/api"
 *
 * const orpc = createORPCClient<AppRouter>(new RPCLink({ url: "/api/orpc" }))
 * const ious = await orpc.iou.list({ limit: 10 })
 * ```
 */
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { createContext } from "@nexus/api/context";
import { appRouter } from "../../../lib/api";

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error("[oRPC error]", error);
		}),
	],
});

async function handle(request: Request): Promise<Response> {
	const result = await rpcHandler.handle(request, {
		prefix: "/api/orpc",
		context: await createContext({ req: request }),
	});

	if (result.response) return result.response;

	return new Response(JSON.stringify({ error: "Not Found" }), {
		status: 404,
		headers: { "Content-Type": "application/json" },
	});
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
