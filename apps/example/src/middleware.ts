import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware for authentication.
 * Redirects unauthenticated users to /login page.
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Public paths that don't require authentication
	const publicPaths = ["/login", "/api/auth/sandbox-login", "/api/auth/logout"];

	// Allow public paths
	if (publicPaths.some((path) => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	// Check for session cookie
	const sessionCookie = request.cookies.get("nexus_session");

	// No session → redirect to login
	if (!sessionCookie) {
		const loginUrl = new URL("/login", request.url);
		// Add redirect parameter to return to original page after login
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Session exists → allow request
	return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (public folder)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
