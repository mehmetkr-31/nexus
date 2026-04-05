/**
 * Canton Ledger API proxy — BFF (Backend for Frontend) pattern.
 *
 * Requests from the browser go through here. The server:
 *   1. Validates the session cookie
 *   2. Injects the Canton JWT (never exposed to the browser)
 *   3. Forwards the request to Canton
 *
 * The browser never sees the Canton JWT.
 */
import { createLedgerRouteHandler } from "@nexus-framework/react/server";
import { sessionManager } from "../../../lib/nexus-server";

const handler = createLedgerRouteHandler({
	ledgerApiUrl: process.env.CANTON_API_URL ?? "http://localhost:7575",
	mountPath: "/api/ledger",
	sessionManager,
	// Optional: restrict to read-only paths
	// allowedPaths: ["/v2/state/", "/v2/packages"],
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
