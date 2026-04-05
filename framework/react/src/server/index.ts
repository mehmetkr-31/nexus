/**
 * @nexus-framework/react/server
 *
 * Server-side utilities for Canton ledger integration.
 * Works with Next.js App Router, Hono, and TanStack Start.
 *
 * IMPORTANT: Do NOT import this in client components ("use client" files).
 */

export {
	createHonoLedgerMiddleware,
	createHonoLedgerRoutes,
	createTanStackLedgerContext,
	type NexusAdapterConfig,
} from "./adapters.ts";
export {
	createLedgerRouteHandler,
	type LedgerRouteHandler,
	type LedgerRouteHandlerConfig,
} from "./route-handler.ts";
export { type LedgerActionResult, withLedgerAction } from "./server-actions.ts";
export type { ServerNexusConfig } from "./server-client.ts";
export { createServerNexusClient, createServerNexusClientFromSession } from "./server-client.ts";
export {
	type GetLedgerDataOptions,
	getLedgerData,
	type PrefetchContractOptions,
	type PrefetchInterfaceOptions,
	prefetchNexusQuery,
} from "./server-queries.ts";
