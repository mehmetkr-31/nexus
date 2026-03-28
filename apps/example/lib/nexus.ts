import { createNexus, sandboxAuth, SessionManager } from "@nexus-framework/core";
import { createServerNexusClient } from "@nexus-framework/react/server";

// ─── Config ──────────────────────────────────────────────────────────────────

export const CANTON_API_URL = process.env.CANTON_API_URL ?? "http://localhost:7575";
export const SESSION_ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY;

// For demo/sandbox mode: fixed credentials
export const SANDBOX_SECRET = process.env.SANDBOX_SECRET ?? "secret";
export const SANDBOX_USER_ID = process.env.SANDBOX_USER_ID ?? "alice";
export const SANDBOX_PARTY_ID =
	process.env.SANDBOX_PARTY_ID ??
	"Alice::122059a10c67ef1bb38e4e7ff3fd9c827e2e6cbbfd68bb5cd8fa4c0c56fecdf0734b";

// Demo Iou template (deployed in the example Daml project)
export const IOU_TEMPLATE_ID = "nexus-example:Iou:Iou";

// ─── Session manager singleton ───────────────────────────────────────────────

export const sessionManager = new SessionManager({
	encryptionKey: SESSION_ENCRYPTION_KEY,
	secure: process.env.NODE_ENV === "production",
});

// ─── Server-side client factory ──────────────────────────────────────────────

/**
 * Build a NexusClient for use in Server Components / Server Actions.
 * Reads the auth token from the session cookie.
 * Falls back to sandbox credentials when no session cookie is present (demo mode).
 */
export async function getServerClient(cookieHeader: string | null) {
	// If no session cookie, fall back to sandbox credentials (demo mode)
	if (!cookieHeader) {
		return createNexus({
			ledgerApiUrl: CANTON_API_URL,
			plugins: [
				sandboxAuth({
					secret: SANDBOX_SECRET,
					userId: SANDBOX_USER_ID,
					partyId: SANDBOX_PARTY_ID,
				}),
			],
		});
	}

	const fakeRequest = new Request("http://localhost", {
		headers: { cookie: cookieHeader },
	});

	try {
		return await createServerNexusClient({
			request: fakeRequest,
			config: {
				ledgerApiUrl: CANTON_API_URL,
				sessionEncryptionKey: SESSION_ENCRYPTION_KEY,
			},
		});
	} catch {
		// Session invalid/expired — fall back to sandbox mode
		return createNexus({
			ledgerApiUrl: CANTON_API_URL,
			plugins: [
				sandboxAuth({
					secret: SANDBOX_SECRET,
					userId: SANDBOX_USER_ID,
					partyId: SANDBOX_PARTY_ID,
				}),
			],
		});
	}
}
