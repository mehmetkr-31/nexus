/**
 * Authentication hooks using TanStack Query
 * Provides type-safe login/logout mutations with loading states
 */
"use client";

import { useMutation } from "@tanstack/react-query";

interface LoginRequest {
	userId: string;
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

/**
 * Hook for sandbox login
 *
 * @example
 * ```tsx
 * const login = useLogin();
 *
 * const handleSubmit = () => {
 *   login.mutate({ userId: "alice" }, {
 *     onSuccess: (data) => {
 *       console.log("Logged in as", data.userId);
 *       router.push("/");
 *     }
 *   });
 * };
 *
 * return (
 *   <button onClick={handleSubmit} disabled={login.isPending}>
 *     {login.isPending ? "Logging in..." : "Login"}
 *   </button>
 * );
 * ```
 */
export function useLogin() {
	return useMutation<LoginResponse, Error, LoginRequest>({
		mutationKey: ["auth", "login"],
		mutationFn: async (data: LoginRequest) => {
			const response = await fetch("/api/auth/sandbox-login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Login failed");
			}

			return response.json();
		},
	});
}

/**
 * Hook for logout
 *
 * @example
 * ```tsx
 * const logout = useLogout();
 *
 * const handleLogout = () => {
 *   logout.mutate(undefined, {
 *     onSuccess: () => {
 *       router.push("/login");
 *     }
 *   });
 * };
 *
 * return (
 *   <button onClick={handleLogout} disabled={logout.isPending}>
 *     {logout.isPending ? "Logging out..." : "Logout"}
 *   </button>
 * );
 * ```
 */
export function useLogout() {
	return useMutation<LogoutResponse, Error, void>({
		mutationKey: ["auth", "logout"],
		mutationFn: async () => {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Logout failed");
			}

			return response.json();
		},
	});
}
