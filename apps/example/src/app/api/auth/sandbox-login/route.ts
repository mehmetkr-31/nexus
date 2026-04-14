/**
 * Sandbox Login Endpoint
 *
 * Provisions a Canton sandbox user and creates an encrypted session cookie.
 * Development-only - NOT for production use.
 *
 * @example
 * POST /api/auth/sandbox-login
 * { "userId": "alice" }
 */
import { provisionSandboxUser } from "@nexus-framework/core";
import type { NextRequest } from "next/server";
import { CANTON_API_URL, SANDBOX_SECRET, SANDBOX_USERS } from "../../../../lib/constants";
import { nexus, sessionManager } from "../../../../lib/nexus-server";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { userId } = body;

		// Validate user ID
		if (!userId || typeof userId !== "string") {
			return Response.json({ error: "userId is required" }, { status: 400 });
		}

		// Optional: Validate against allowed users
		const allowedUsers: string[] = [...SANDBOX_USERS];
		if (!allowedUsers.includes(userId)) {
			return Response.json(
				{ error: `Invalid user. Allowed users: ${SANDBOX_USERS.join(", ")}` },
				{ status: 400 },
			);
		}

		console.log(`[Auth] Logging in as "${userId}"...`);

		// 1. Provision user in Canton (idempotent)
		const partyId = await provisionSandboxUser({
			ledgerApiUrl: CANTON_API_URL,
			userId,
			secret: SANDBOX_SECRET,
		});

		// 2. Get JWT token for this user
		const token = await nexus.client.getToken();

		// 3. Create encrypted session cookie
		const cookieValue = await sessionManager.createSessionCookie({
			partyId,
			userId,
			token,
		});

		console.log(`[Auth] Login successful: ${userId} (${partyId})`);

		// 4. Return success with Set-Cookie header
		return Response.json(
			{ success: true, userId, partyId },
			{
				status: 200,
				headers: {
					"Set-Cookie": cookieValue,
				},
			},
		);
	} catch (error) {
		console.error("[Auth] Login failed:", error);
		return Response.json({ error: "Login failed", details: String(error) }, { status: 500 });
	}
}
