"use client";

import { createNexus, type NexusClient, type NexusPlugin } from "@nexus-framework/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode, useMemo } from "react";
import type { NexusClientPlugin } from "./plugins/tanstack-query.ts";

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

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;

/** Extract the context type contributed by a single plugin ($Infer or init return). */
export type ExtractPluginContext<P> = P extends { $Infer?: infer T }
	? T
	: P extends { init?: (client: NexusClient) => infer T }
		? T extends Promise<infer R>
			? R
			: T
		: Record<string, never>;

/** Extract the actions contributed by a single React plugin. */
export type ExtractPluginActions<P> = P extends { getActions?: (client: NexusClient) => infer T }
	? T
	: Record<string, never>;

/** Merge all plugin contexts and actions from an array into one intersection type. */
export type InferNexusPlugins<P extends readonly AnyPlugin[]> = UnionToIntersection<
	ExtractPluginContext<P[number]> & ExtractPluginActions<P[number]>
>;

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
export type NexusClientInstance<TPluginContext = Record<string, never>> = NexusClient &
	TPluginContext & {
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
export async function createNexusClient<TPlugins extends AnyPlugin[]>(options: {
	baseUrl: string;
	apiPathPrefix?: string;
	timeoutMs?: number;
	plugins: TPlugins;
}): Promise<NexusClientInstance<InferNexusPlugins<TPlugins>>> {
	const serverPlugins = options.plugins.filter(
		(p): p is NexusPlugin<Record<string, unknown>> => "auth" in p || "init" in p,
	);
	const clientPlugins = options.plugins.filter((p): p is NexusClientPlugin => "getActions" in p);

	const coreClient = await createNexus({
		ledgerApiUrl: options.baseUrl,
		apiPathPrefix: options.apiPathPrefix,
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

	// First pass: collect all plugin actions so they can reference each other
	const allActions: Record<string, unknown>[] = [];
	for (const p of clientPlugins) {
		if (p.getActions) {
			allActions.push(p.getActions(coreClient));
		}
	}

	// Merge all actions into a single object
	const mergedActions = Object.assign({}, ...allActions) as InferNexusPlugins<TPlugins> &
		Record<string, unknown>;

	// Now replace each plugin's client with one that has access to all merged actions
	// This allows tanstackQueryPlugin to access optimistic plugin's actions
	const actions = Object.assign(
		{},
		...clientPlugins.map((p) => {
			if (!p.getActions) return {};
			const pluginActions = p.getActions({
				...coreClient,
				...mergedActions,
			} as NexusClient);
			return pluginActions;
		}),
	) as InferNexusPlugins<TPlugins> & Record<string, unknown>;

	// Only QueryClientProvider — NexusContext not needed
	function BoundNexusProvider({
		children,
		queryClient: externalQueryClient,
	}: NexusProviderComponentProps): ReactNode {
		// Stability is key for SSR hydration — use the provided client or a single lazy instance
		const queryClient = useMemo(
			() => externalQueryClient ?? createDefaultQueryClient(),
			[externalQueryClient],
		);
		return createElement(QueryClientProvider, { client: queryClient }, children);
	}

	return {
		...actions,
		config: coreClient.config,
		packages: coreClient.packages,
		http: coreClient.http,
		auth: coreClient.auth,
		ledger: coreClient.ledger,
		getToken: () => coreClient.getToken(),
		NexusProvider: BoundNexusProvider,
	};
}
