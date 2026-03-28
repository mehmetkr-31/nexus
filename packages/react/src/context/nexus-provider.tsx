"use client";

import {
	createNexusClient as createNexusClientLegacy,
	type NexusClient,
	type NexusConfig,
} from "@nexus-framework/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────

export const NexusContext = createContext<NexusClient | null>(null);

// ─── NexusProvider ────────────────────────────────────────────────────────────

export interface NexusProviderProps {
	/**
	 * @deprecated Pass a pre-configured `client` instead.
	 * Use `createNexus()` with auth plugins to create the client.
	 */
	config?: NexusConfig;
	children: ReactNode;
	/**
	 * Provide a pre-configured NexusClient.
	 * Preferred over `config` — use `createNexus()` or `createNexusClient()` to create one.
	 */
	client?: NexusClient;
	/**
	 * Optionally provide a pre-configured QueryClient.
	 * If omitted, a default one is created with sensible Canton-friendly defaults.
	 */
	queryClient?: QueryClient;
}

export function createDefaultQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// Canton finality takes 3-10s — stale after 5s is a reasonable default
				staleTime: 5_000,
				retry: 2,
				retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
			},
			mutations: {
				retry: 0,
			},
		},
	});
}

/**
 * NexusProvider wraps your application with both the Nexus client context
 * and TanStack QueryClientProvider.
 *
 * Preferred usage with `createNexusClient()`:
 * ```tsx
 * const nexus = createNexusClient({ baseUrl: "...", plugins: [...] });
 * <nexus.NexusProvider>{children}</nexus.NexusProvider>
 * ```
 *
 * Legacy usage with `config`:
 * ```tsx
 * <NexusProvider config={{ ledgerApiUrl: "http://localhost:7575", auth: { ... } }}>
 *   <App />
 * </NexusProvider>
 * ```
 */
export function NexusProvider({
	config,
	children,
	client: externalClient,
	queryClient: externalQueryClient,
}: NexusProviderProps) {
	const nexusClient = useMemo(() => {
		if (externalClient) return externalClient;
		if (!config) {
			throw new Error(
				"NexusProvider: either 'client' or 'config' must be provided. " +
					"Use createNexusClient() to create a client and pass it via the 'client' prop.",
			);
		}
		return createNexusClientLegacy(config);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config, externalClient]);

	const queryClient = useMemo(
		() => externalQueryClient ?? createDefaultQueryClient(),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[externalQueryClient],
	);

	return (
		<NexusContext.Provider value={nexusClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</NexusContext.Provider>
	);
}

// ─── useNexusClient ───────────────────────────────────────────────────────────

/**
 * Returns the NexusClient from the nearest NexusProvider.
 * Throws if called outside of a NexusProvider.
 */
export function useNexusClient(): NexusClient {
	const client = useContext(NexusContext);
	if (!client) {
		throw new Error(
			"useNexusClient must be used within a <NexusProvider>. " +
				"Make sure your component tree is wrapped with <NexusProvider> or use createNexusClient().",
		);
	}
	return client;
}
