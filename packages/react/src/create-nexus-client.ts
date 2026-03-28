"use client";

import { createNexus, type NexusClient, type NexusPlugin } from "@nexus-framework/core";
import { type QueryClient } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
	createDefaultQueryClient,
	NexusContext,
} from "./context/nexus-provider.tsx";
import type { NexusClientPlugin, TanstackQueryActions } from "./plugins/tanstack-query.ts";
import { QueryClientProvider } from "@tanstack/react-query";

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
	 * Wrap your component tree with this to enable all Nexus hooks.
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
 * Returns a `NexusClientInstance` with a bound `NexusProvider` and all
 * hooks added by the provided client plugins (e.g. `tanstackQueryPlugin()`).
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
 * // In your app root:
 * export function App() {
 *   return <nexus.NexusProvider><MyPage /></nexus.NexusProvider>;
 * }
 *
 * // In a component:
 * const { data } = nexus.useContracts({ templateId: "pkg:Mod:Iou" });
 * ```
 */
export function createNexusClient(options: {
	baseUrl: string;
	timeoutMs?: number;
	plugins: AnyPlugin[];
}): NexusClientInstance {
	// Separate server plugins (have auth/init) from client plugins (have getActions)
	const serverPlugins = options.plugins.filter(
		(p): p is NexusPlugin => "auth" in p || "init" in p,
	);
	const clientPlugins = options.plugins.filter(
		(p): p is NexusClientPlugin => "getActions" in p,
	);

	// Create the core Canton client
	const coreClient = createNexus({
		ledgerApiUrl: options.baseUrl,
		timeoutMs: options.timeoutMs,
		plugins: serverPlugins,
	});

	// Collect actions from all client plugins
	const actions = Object.assign(
		{},
		...clientPlugins.map((p) => (p.getActions ? p.getActions(() => coreClient) : {})),
	) as TanstackQueryActions;

	// A bound NexusProvider that sets up context and QueryClient for this client
	function BoundNexusProvider({ children, queryClient }: NexusProviderComponentProps): ReactNode {
		const qc = queryClient ?? createDefaultQueryClient();
		return createElement(
			NexusContext.Provider,
			{ value: coreClient },
			createElement(QueryClientProvider, { client: qc }, children),
		);
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
