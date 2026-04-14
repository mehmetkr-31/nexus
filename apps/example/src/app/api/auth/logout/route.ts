/**
 * Logout Endpoint
 *
 * Clears the session cookie and logs out the user.
 *
 * @example
 * POST /api/auth/logout
 */
import type { NextRequest } from "next/server";
import { sessionManager } from "../../../../lib/nexus-server";

export async function POST(req: NextRequest) {
	try {
		console.log("[Auth] Logging out...");

		// Create a cookie that clears the session
		const clearCookie = sessionManager.destroySessionCookie();

		return Response.json(
			{ success: true, message: "Logged out successfully" },
			{
				status: 200,
				headers: {
					"Set-Cookie": clearCookie,
				},
			},
		);
	} catch (error) {
		console.error("[Auth] Logout failed:", error);
		return Response.json({ error: "Logout failed", details: String(error) }, { status: 500 });
	}
}
