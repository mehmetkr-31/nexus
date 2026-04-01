/**
 * @nexus-framework/react/server
 *
 * Next.js Server-side utilities for Canton ledger integration.
 * Import from "@nexus-framework/react/server" in Server Components and Server Actions.
 *
 * IMPORTANT: Do NOT import this in client components ("use client" files).
 */

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
