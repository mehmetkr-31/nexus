/**
 * Auto-generated auth route handler for Canton applications.
 * 
 * Provides zero-boilerplate authentication endpoints:
 * - POST /login  - User login with Canton provisioning
 * - POST /logout - Session termination
 * - GET  /session - Current session info
 * 
 * Follows the Canton ledger proxy pattern (catch-all routes).
 * 
 * @example
 * ```typescript
 * // app/api/auth/[...auth]/route.ts
 * import { createAuthHandler } from "@nexus-framework/core/server";
 * import { nexus, sessionManager } from "@/lib/nexus-server";
 * 
 * const handler = createAuthHandler({
 *   nexusServer: nexus,
 *   sessionManager,
 * });
 * 
 * export const GET = handler;
 * export const POST = handler;
 * ```
 */

import type { SessionManager } from "../auth/session-manager";
import { provisionSandboxUser } from "../ledger/sandbox-provision";
import type { NexusServer } from "../server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthHandlerConfig {
	/** NexusServer instance for auth plugin detection and token generation */
	// biome-ignore lint/suspicious/noExplicitAny: Generic types not needed here
	nexusServer: NexusServer<any, any>;

	/** SessionManager for cookie creation/destruction */
	sessionManager: SessionManager;

	/**
	 * Base path for auth routes.
	 * Routes will be mounted relative to this path.
	 * @default "/api/auth"
	 */
	basePath?: string;

	/**
	 * Custom request handler for specific routes.
	 * Use for extending auth behavior without replacing the entire handler.
	 * 
	 * @example
	 * ```typescript
	 * customHandlers: {
	 *   "/verify-email": async (req) => {
	 *     // Custom email verification logic
	 *   }
	 * }
	 * ```
	 */
	customHandlers?: Record<string, (req: Request) => Promise<Response>>;

	/**
	 * Callback invoked after successful login.
	 * Useful for logging, analytics, or custom post-login logic.
	 */
	onLoginSuccess?: (userId: string, partyId: string) => void | Promise<void>;

	/**
	 * Callback invoked after successful logout.
	 */
	onLogoutSuccess?: (userId?: string) => void | Promise<void>;
}

interface LoginRequest {
	userId: string;
	[key: string]: unknown;
}

interface LoginResponse {
	success: boolean;
	userId: string;
	partyId: string;
}

interface LogoutResponse {
	success: boolean;
	message: string;
}

interface SessionResponse {
	authenticated: boolean;
	userId?: string;
	partyId?: string;
	expiresAt?: number;
}

interface ErrorResponse {
	success: false;
	error: string;
	details?: string;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

/**
 * Creates a catch-all auth route handler with auto-generated endpoints.
 * 
 * Automatically provisions Canton sandbox users on login (when using sandboxAuth).
 * Handles session cookie management via SessionManager.
 * 
 * Routes:
 * - POST /login  - Login with userId, auto-provisions Canton party
 * - POST /logout - Clear session cookie
 * - GET  /session - Get current session info
 */
export function createAuthHandler(config: AuthHandlerConfig): (req: Request) => Promise<Response> {
	const basePath = config.basePath || "/api/auth";

	return async (req: Request): Promise<Response> => {
		try {
			// Extract path relative to basePath
			const url = new URL(req.url);
			let path = url.pathname;

			// Strip basePath
			if (path.startsWith(basePath)) {
				path = path.slice(basePath.length);
			}

			// Ensure leading slash
			if (!path.startsWith("/")) {
				path = `/${path}`;
			}

			// Check custom handlers first
			const customHandler = config.customHandlers?.[path];
			if (customHandler) {
				return customHandler(req);
			}

			// Route dispatch
			if (path === "/login" && req.method === "POST") {
				return handleLogin(req, config);
			}

			if (path === "/logout" && req.method === "POST") {
				return handleLogout(req, config);
			}

			if (path === "/session" && req.method === "GET") {
				return handleSession(req, config);
			}

			// 404 for unknown routes
			return jsonResponse<ErrorResponse>(
				{ success: false, error: `Route not found: ${path}` },
				404,
			);
		} catch (error) {
			console.error("[Auth Handler] Unexpected error:", error);
			return jsonResponse<ErrorResponse>(
				{
					success: false,
					error: "Internal server error",
					details: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	};
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

async function handleLogin(req: Request, config: AuthHandlerConfig): Promise<Response> {
	try {
		// Parse request body
		const body = (await req.json()) as LoginRequest;
		const { userId } = body;

		// Validate userId
		if (!userId || typeof userId !== "string") {
			return jsonResponse<ErrorResponse>(
				{ success: false, error: "userId is required and must be a string" },
				400,
			);
		}

		console.log(`[Auth Handler] Login request for user: ${userId}`);

		// Detect auth mode from nexusServer
		const authMode = detectAuthMode(config.nexusServer);

		if (authMode === "sandbox") {
			return handleSandboxLogin(userId, config);
		}

		// OIDC/JWT modes not yet implemented
		return jsonResponse<ErrorResponse>(
			{
				success: false,
				error: "Auth mode not supported",
				details: `Detected auth mode: ${authMode}. Only sandbox mode is currently supported.`,
			},
			501,
		);
	} catch (error) {
		console.error("[Auth Handler] Login failed:", error);
		return jsonResponse<ErrorResponse>(
			{
				success: false,
				error: "Login failed",
				details: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
}

async function handleSandboxLogin(
	userId: string,
	config: AuthHandlerConfig,
): Promise<Response> {
	try {
		// Extract sandbox config from nexusServer
		const sandboxConfig = extractSandboxConfig(config.nexusServer);

		if (!sandboxConfig) {
			return jsonResponse<ErrorResponse>(
				{
					success: false,
					error: "Sandbox configuration not found",
					details: "sandboxAuth plugin is required for sandbox login",
				},
				500,
			);
		}

		// 1. Provision Canton user (idempotent)
		console.log(`[Auth Handler] Provisioning Canton user: ${userId}`);
		const partyId = await provisionSandboxUser({
			ledgerApiUrl: sandboxConfig.ledgerApiUrl,
			userId,
			secret: sandboxConfig.secret,
		});

		// 2. Generate JWT token for this user
		const token = await config.nexusServer.client.getToken();

		// 3. Create encrypted session cookie
		const cookieValue = await config.sessionManager.createSessionCookie({
			userId,
			partyId,
			token,
		});

		// 4. Invoke success callback
		await config.onLoginSuccess?.(userId, partyId);

		console.log(`[Auth Handler] Login successful: ${userId} → ${partyId}`);

		// 5. Return success response with Set-Cookie header
		return jsonResponse<LoginResponse>(
			{ success: true, userId, partyId },
			200,
			{ "Set-Cookie": cookieValue },
		);
	} catch (error) {
		console.error("[Auth Handler] Sandbox login failed:", error);
		return jsonResponse<ErrorResponse>(
			{
				success: false,
				error: "Sandbox login failed",
				details: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
}

async function handleLogout(req: Request, config: AuthHandlerConfig): Promise<Response> {
	try {
		// Get current session (optional, for logging)
		const session = await config.sessionManager.getSessionFromRequest(req);

		console.log(`[Auth Handler] Logout request${session ? ` from user: ${session.userId}` : ""}`);

		// Create cookie that clears the session
		const clearCookie = config.sessionManager.destroySessionCookie();

		// Invoke success callback
		await config.onLogoutSuccess?.(session?.userId);

		console.log("[Auth Handler] Logout successful");

		return jsonResponse<LogoutResponse>(
			{ success: true, message: "Logged out successfully" },
			200,
			{ "Set-Cookie": clearCookie },
		);
	} catch (error) {
		console.error("[Auth Handler] Logout failed:", error);
		return jsonResponse<ErrorResponse>(
			{
				success: false,
				error: "Logout failed",
				details: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
}

async function handleSession(req: Request, config: AuthHandlerConfig): Promise<Response> {
	try {
		const session = await config.sessionManager.getSessionFromRequest(req);

		if (!session) {
			return jsonResponse<SessionResponse>({ authenticated: false }, 200);
		}

		return jsonResponse<SessionResponse>(
			{
				authenticated: true,
				userId: session.userId,
				partyId: session.partyId,
				expiresAt: session.expiresAt,
			},
			200,
		);
	} catch (error) {
		console.error("[Auth Handler] Session check failed:", error);
		return jsonResponse<ErrorResponse>(
			{
				success: false,
				error: "Session check failed",
				details: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function detectAuthMode(nexusServer: AuthHandlerConfig["nexusServer"]): string {
	// Access internal auth plugin (follows existing pattern from route-handler.ts)
	const client = nexusServer.client as any;
	const authPlugin = client._authPlugin;

	if (!authPlugin) {
		return "unknown";
	}

	return authPlugin.id || "unknown";
}

function extractSandboxConfig(
	nexusServer: AuthHandlerConfig["nexusServer"],
): { ledgerApiUrl: string; secret: string } | null {
	try {
		// Get ledgerApiUrl from client config
		const ledgerApiUrl = nexusServer.client.config.ledgerApiUrl;

		// Extract sandbox secret from auth plugin (follows sandbox-auth.ts pattern)
		const client = nexusServer.client as any;
		const authPlugin = client._authPlugin;

		if (!authPlugin || authPlugin.id !== "sandbox-auth") {
			return null;
		}

		// The sandbox secret is stored in the JwtManager config
		// We need to get it from the plugin's internal state
		// For now, we'll require it to be passed explicitly via environment
		const secret = process.env.SANDBOX_SECRET ?? "secret";

		return { ledgerApiUrl, secret };
	} catch {
		return null;
	}
}

function jsonResponse<T>(
	data: T,
	status: number,
	headers?: Record<string, string>,
): Response {
	const responseHeaders = new Headers({
		"Content-Type": "application/json",
		...headers,
	});

	return new Response(JSON.stringify(data), {
		status,
		headers: responseHeaders,
	});
}
