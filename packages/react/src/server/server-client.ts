import {
	createNexus,
	jwtAuth,
	NexusAuthError,
	type NexusClient,
	type NexusSession,
	SessionManager,
} from "@nexus-framework/core";

export interface ServerNexusConfig {
	ledgerApiUrl: string;
	/** AES-GCM encryption key for session cookies (32-byte hex string) */
	sessionEncryptionKey?: string;
	/** Cookie name override */
	sessionCookieName?: string;
}

/**
 * Create a NexusClient for use in Next.js Server Components and Server Actions.
 *
 * Reads the auth token from the session cookie attached to a Request.
 * The returned client is scoped to the authenticated user's party.
 *
 * @example
 * ```ts
 * // In a Next.js Server Component:
 * import { cookies } from "next/headers";
 * import { createServerNexusClient } from "@nexus-framework/react/server";
 *
 * export default async function Page() {
 *   const nexus = await createServerNexusClient({
 *     request: new Request("http://localhost", { headers: { cookie: cookies().toString() } }),
 *     config: { ledgerApiUrl: process.env.CANTON_API_URL! },
 *   });
 *
 *   const { contracts } = await nexus.ledger.contracts.fetchActiveContracts({
 *     templateId: "pkg:Mod:Iou",
 *   });
 *   // ...
 * }
 * ```
 */
export async function createServerNexusClient(options: {
	request: Request;
	config: ServerNexusConfig;
}): Promise<NexusClient> {
	const { request, config } = options;

	const sessionMgr = new SessionManager({
		encryptionKey: config.sessionEncryptionKey,
		cookieName: config.sessionCookieName,
		secure: process.env.NODE_ENV === "production",
	});

	const session = await sessionMgr.getSessionFromRequest(request);
	if (!session) {
		throw new NexusAuthError(
			"No valid session found. User must authenticate before accessing the ledger.",
		);
	}

	return await createServerNexusClientFromSession(session, config.ledgerApiUrl);
}

/**
 * Create a NexusClient directly from a NexusSession.
 * Useful when you already have the session object (e.g., from middleware).
 */
export async function createServerNexusClientFromSession(
	session: NexusSession,
	ledgerApiUrl: string,
): Promise<NexusClient> {
	return await createNexus({
		ledgerApiUrl,
		plugins: [jwtAuth({ token: session.token })],
	});
}
