"use client";

import { createNexus, type NexusClient, type NexusPlugin } from "@nexus-framework/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode, useMemo } from "react";
import type { NexusClientPlugin, TanstackQueryActions } from "./plugins/tanstack-query.ts";

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

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnyPlugin = NexusPlugin | NexusClientPlugin;

export interface NexusProviderComponentProps {
	children: ReactNode;
	/** Optionally override the QueryClient for this provider */
	queryClient?: QueryClient;
}

/**
 * The object returned by `createNexusClient()`.
 * Combines the core `NexusClient` with hooks from client plugins
 * and a pre-configured `NexusProvider` component.
 */
export type NexusClientInstance<TActions = TanstackQueryActions> = NexusClient &
	TActions & {
		/**
		 * A React provider component pre-configured for this client.
		 * Only wraps `QueryClientProvider` — no NexusContext needed since
		 * hooks close over the client instance directly.
		 *
		 * @example
		 * ```tsx
		 * export function App() {
		 *   return (
		 *     <nexus.NexusProvider>
		 *       <MyPage />
		 *     </nexus.NexusProvider>
		 *   );
		 * }
		 * ```
		 */
		NexusProvider: (props: NexusProviderComponentProps) => ReactNode;
	};

// ─── createNexusClient ────────────────────────────────────────────────────────

/**
 * Create a Nexus client with React hooks via the plugin-based API.
 *
 * Hooks produced by client plugins (e.g. `tanstackQueryPlugin()`) close
 * over the `NexusClient` instance directly — no React Context is injected.
 * Only a `QueryClientProvider` is needed in the component tree (provided
 * automatically by `nexus.NexusProvider`).
 *
 * @example
 * ```ts
 * import { createNexusClient, sandboxAuth, tanstackQueryPlugin } from "@nexus-framework/react";
 *
 * const nexus = createNexusClient({
 *   baseUrl: "http://localhost:7575",
 *   plugins: [
 *     sandboxAuth({ userId: "alice", secret: "secret", partyId: "Alice::..." }),
 *     tanstackQueryPlugin(),
 *   ],
 * });
 *
 * // Wrap app root:
 * <nexus.NexusProvider><App /></nexus.NexusProvider>
 *
 * // In a component — no import from context needed:
 * const { data } = nexus.useContracts({ templateId: "pkg:Mod:Iou" });
 * ```
 */
export function createNexusClient<TActions = TanstackQueryActions>(options: {
	baseUrl: string;
	timeoutMs?: number;
	plugins: AnyPlugin[];
}): NexusClientInstance<TActions> {
	const serverPlugins = options.plugins.filter((p): p is NexusPlugin => "auth" in p || "init" in p);
	const clientPlugins = options.plugins.filter((p): p is NexusClientPlugin => "getActions" in p);

	const coreClient = createNexus({
		ledgerApiUrl: options.baseUrl,
		timeoutMs: options.timeoutMs,
		plugins: [
			...serverPlugins,
			// Bridge core refreshes to client plugins
			{
				id: "react-plugin-bridge",
				onTokenRefreshed: (newToken) => {
					for (const p of clientPlugins) {
						p.onTokenRefreshed?.(newToken);
					}
				},
			},
		],
	});

	// Actions close over coreClient — no context involved
	const actions = Object.assign(
		{},
		...clientPlugins.map((p) => (p.getActions ? p.getActions(coreClient) : {})),
	) as TActions;

	// Only QueryClientProvider — NexusContext not needed
	function BoundNexusProvider({
		children,
		queryClient: externalQueryClient,
	}: NexusProviderComponentProps): ReactNode {
		const queryClient = useMemo(
			() => externalQueryClient ?? createDefaultQueryClient(),
			[externalQueryClient],
		);
		return createElement(QueryClientProvider, { client: queryClient }, children);
	}

	return {
		...actions,
		http: coreClient.http,
		auth: coreClient.auth,
		ledger: coreClient.ledger,
		getToken: () => coreClient.getToken(),
		NexusProvider: BoundNexusProvider,
	};
}
