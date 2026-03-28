"use client";

import { createNexus, type NexusClient, type NexusPlugin } from "@nexus-framework/core";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { createDefaultQueryClient } from "./context/nexus-provider.tsx";
import type { NexusClientPlugin, TanstackQueryActions } from "./plugins/tanstack-query.ts";

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
export interface NexusClientInstance extends NexusClient, TanstackQueryActions {
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
}

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
export function createNexusClient(options: {
	baseUrl: string;
	timeoutMs?: number;
	plugins: AnyPlugin[];
}): NexusClientInstance {
	const serverPlugins = options.plugins.filter((p): p is NexusPlugin => "auth" in p || "init" in p);
	const clientPlugins = options.plugins.filter((p): p is NexusClientPlugin => "getActions" in p);

	const coreClient = createNexus({
		ledgerApiUrl: options.baseUrl,
		timeoutMs: options.timeoutMs,
		plugins: serverPlugins,
	});

	// Actions close over coreClient — no context involved
	const actions = Object.assign(
		{},
		...clientPlugins.map((p) => (p.getActions ? p.getActions(coreClient) : {})),
	) as TanstackQueryActions;

	// Only QueryClientProvider — NexusContext not needed
	function BoundNexusProvider({ children, queryClient }: NexusProviderComponentProps): ReactNode {
		const qc = queryClient ?? createDefaultQueryClient();
		return createElement(QueryClientProvider, { client: qc }, children);
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
