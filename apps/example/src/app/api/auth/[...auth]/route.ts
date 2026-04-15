/**
 * Auto-generated auth routes.
 *
 * This single catch-all route replaces 150+ lines of manual auth route code.
 *
 * Provides:
 * - POST /api/auth/login  - User login with Canton provisioning
 * - POST /api/auth/logout - Session termination
 * - GET  /api/auth/session - Current session info
 */

import { createAuthHandler } from "@nexus-framework/core";
import { nexus, sessionManager } from "@/lib/nexus-server";

const handler = createAuthHandler({
	nexusServer: nexus,
	sessionManager,
	onLoginSuccess: (userId, partyId) => {
		console.log(`[Auth] Login successful: ${userId} → ${partyId}`);
	},
	onLogoutSuccess: (userId) => {
		console.log(`[Auth] Logout successful${userId ? `: ${userId}` : ""}`);
	},
});

export const GET = handler;
export const POST = handler;
