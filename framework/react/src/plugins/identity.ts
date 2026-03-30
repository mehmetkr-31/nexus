"use client";

import { decodeJwtPayload, type JwtPayload, type NexusClient } from "@nexus-framework/core";
import { useEffect, useState } from "react";
import type { NexusClientPlugin } from "./tanstack-query.ts";

export interface IdentityActions extends Record<string, unknown> {
	/**
	 * Returns the decoded JWT payload of the current session.
	 * Updates automatically when the token is refreshed.
	 */
	useUser: () => JwtPayload | null;

	/**
	 * Returns the parties (actAs/readAs) the current user can act as.
	 * Derived from the JWT payload.
	 */
	useParties: () => { actAs: string[]; readAs: string[] };

	/**
	 * Returns the authentication status of the client.
	 */
	useAuthStatus: () => {
		isAuthenticated: boolean;
		token: string | null;
	};
}

/**
 * Plugin that provides reactive access to the current user's identity and permissions.
 *
 * Hooks close over the `NexusClient` and subscribe to token refreshes to keep the
 * UI in sync with the session state.
 */
export function identityPlugin(): NexusClientPlugin<IdentityActions> {
	const listeners = new Set<(token: string | null) => void>();

	return {
		id: "identity",

		onTokenRefreshed: (token) => {
			for (const listener of listeners) {
				listener(token);
			}
		},

		getActions: (client: NexusClient) => {
			const useToken = () => {
				const [token, setToken] = useState<string | null>(client.getCachedToken() || null);

				useEffect(() => {
					const listener = (newToken: string | null) => setToken(newToken);
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				}, []);

				return token;
			};

			return {
				useUser: () => {
					const token = useToken();
					if (!token) return null;
					try {
						return decodeJwtPayload(token);
					} catch (err) {
						console.error("[Nexus] Failed to decode token in useUser:", err);
						return null;
					}
				},

				useParties: () => {
					const token = useToken();
					if (!token) return { actAs: [], readAs: [] };
					try {
						const payload = decodeJwtPayload(token);
						const ledgerApi = payload["https://daml.com/ledger-api"];
						return {
							actAs: ledgerApi?.actAs ?? [],
							readAs: ledgerApi?.readAs ?? [],
						};
					} catch {
						return { actAs: [], readAs: [] };
					}
				},

				useAuthStatus: () => {
					const token = useToken();
					return {
						isAuthenticated: !!token,
						token,
					};
				},
			};
		},
	};
}
