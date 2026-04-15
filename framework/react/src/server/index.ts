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
} from "./adapters";
export {
	createLedgerRouteHandler,
	type LedgerRouteHandler,
	type LedgerRouteHandlerConfig,
} from "./route-handler";
export { type LedgerActionResult, withLedgerAction } from "./server-actions";
export type { ServerNexusConfig } from "./server-client";
export { createServerNexusClient, createServerNexusClientFromSession } from "./server-client";
export {
	type GetLedgerDataOptions,
	getLedgerData,
	type PrefetchContractOptions,
	type PrefetchInterfaceOptions,
	prefetchNexusQuery,
} from "./server-queries";
