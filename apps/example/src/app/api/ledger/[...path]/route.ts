/**
 * Canton Ledger API proxy — BFF (Backend for Frontend) pattern.
 *
 * Requests from the browser go through here. The server:
 *   1. Validates the session cookie (or auto-provisions in sandbox mode).
 *   2. Injects the Canton JWT (never exposed to the browser).
 *   3. Forwards the request to Canton.
 *
 * The browser never sees the Canton JWT.
 */
import { createLedgerRouteHandler } from "@nexus-framework/react/server";
import { CANTON_API_URL } from "../../../../lib/constants";
import { nexus, sessionManager } from "../../../../lib/nexus-server";

const handler = createLedgerRouteHandler({
	ledgerApiUrl: CANTON_API_URL,
	mountPath: "/api/ledger",
	sessionManager,
	nexusServer: nexus, // Auto-detects sandboxAuth and enables auto-provisioning
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
