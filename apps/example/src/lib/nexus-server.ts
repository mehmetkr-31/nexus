import { Iou } from "@daml.js/nexus-example-0.0.1";
import { SessionManager } from "@nexus-framework/core/auth/session-manager";
import { createNexusContextExtractor, createNexusServerClient } from "@nexus-framework/core/server";

const CANTON_API_URL = process.env.CANTON_API_URL ?? "http://localhost:7575";

// Canton Participant Node usually opens a dummy postgres on 5432.
// You can enter your own production PQS here.
const PQS_URL = process.env.PQS_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

// Optional: Provide an encryption key via Env var for secure AES-GCM session cookies
const SESSION_SECRET = process.env.SESSION_SECRET;

/**
 * Standard Session Manager configured for the example app.
 * It will parse "nexus_session" cookies or Authorization headers automatically.
 */
export const sessionManager = new SessionManager({
	encryptionKey: SESSION_SECRET,
	// ttlMs, cookieName, domain can also be configured here
});

/**
 * Our Isomorphic Server Client (for Server Actions, API routes, and ORPC/Trpc)
 * It is completely HIDDEN from the Browser (Frontend bundle).
 *
 * We map the real Daml templates from @daml.js packages to the keys we want.
 */
export const backendSDK = createNexusServerClient(
	{
		Iou: Iou.Iou,
	},
	{
		ledgerUrl: CANTON_API_URL,
		pqsUrl: PQS_URL,
	},
);

/**
 * HIGHEST ABSTRACTION LEVEL:
 * Use this helper inside your Next.js Server Actions, Route Handlers or Hono Middlewares.
 * It automatically parses the JWT/session from the Request and returns the initialized Nexus SDK.
 *
 * @example
 * const nexus = await requireNexusContext(req);
 * const myIous = await nexus.Iou.findMany();
 */
export const requireNexusContext = createNexusContextExtractor(backendSDK, sessionManager);
