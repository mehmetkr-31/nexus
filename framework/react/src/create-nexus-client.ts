"use client";

import { createNexus, type NexusClient, type NexusPlugin } from "@nexus-framework/core";
import type { NexusClientPlugin } from "./plugins/tanstack-query.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;

type ExtractCorePluginContext<P> = P extends { init?: (client: NexusClient) => infer T }
	? T extends Promise<infer R>
		? R
		: T
	: Record<string, never>;

type ExtractReactPluginContext<P> = P extends { $Infer?: infer T }
	? T
	: P extends { getActions?: (client: NexusClient) => infer T }
		? T
		: Record<string, never>;

type ExtractGetActionsContext<P> = P extends { getActions?: (client: NexusClient) => infer T }
	? T
	: Record<string, never>;

export type InferNexusPlugins<P extends AnyPlugin[]> = UnionToIntersection<
	| ExtractCorePluginContext<P[number]>
	| ExtractReactPluginContext<P[number]>
	| ExtractGetActionsContext<P[number]>
>;

export type AnyPlugin = NexusPlugin | NexusClientPlugin;

/**
 * The object returned by `createNexusClient()`.
 * Combines the core `NexusClient` with hooks from client plugins.
 *
 * Nexus hooks close over the client instance directly — no React Context needed.
 * Just ensure `QueryClientProvider` is mounted somewhere above in the tree.
 */
export type NexusClientInstance<TPluginContext = Record<string, never>> = NexusClient &
	TPluginContext;

// ─── createNexusClient ────────────────────────────────────────────────────────

/**
 * Create a Nexus client with React hooks via the plugin-based API.
 *
 * Hooks produced by client plugins (e.g. `tanstackQueryPlugin()`) close
 * over the `NexusClient` instance directly — no React Context is injected.
 *
 * You are responsible for mounting a `QueryClientProvider` in your component tree.
 * Nexus does not create or own a `QueryClient`.
 *
 * @example
 * ```ts
 * // nexus-client.ts
 * export const nexus = await createNexusClient({
 *   baseUrl: "http://localhost:7575",
 *   plugins: [sandboxAuth({ ... }), tanstackQueryPlugin()],
 * });
 *
 * // layout.tsx
 * <QueryClientProvider client={queryClient}>
 *   <App />
 * </QueryClientProvider>
 *
 * // component.tsx
 * const { contracts } = nexus.useContracts({ templateId: "pkg:Mod:Iou" });
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

	return {
		...coreClient,
		...actions,
	} as NexusClientInstance<InferNexusPlugins<TPlugins>>;
}
