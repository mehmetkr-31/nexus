import type { NexusClient } from "@nexus-framework/core";
import { useContracts, useContractsSuspense } from "../hooks/use-contracts.ts";
import { useLedgerEnd, useSynchronizers } from "../hooks/use-ledger-end.ts";
import { usePartyId } from "../hooks/use-party-id.ts";
import { useCreateContract, useExerciseChoice, useLedgerMutation } from "../hooks/use-submit.ts";

// ─── NexusClientPlugin ────────────────────────────────────────────────────────

/**
 * Client-side plugin interface for extending the Nexus client with
 * React hooks and other browser-side capabilities.
 */
export interface NexusClientPlugin {
	/** Unique plugin identifier */
	id: string;
	/**
	 * Return React hooks and actions to merge onto the Nexus client instance.
	 * The `useClient` parameter is the `useNexusClient` hook — passed for
	 * future extensibility.
	 */
	getActions?: (useClient: () => NexusClient) => Record<string, unknown>;
}

// ─── TanstackQueryActions ─────────────────────────────────────────────────────

export interface TanstackQueryActions {
	useContracts: typeof useContracts;
	useContractsSuspense: typeof useContractsSuspense;
	useCreateContract: typeof useCreateContract;
	useExerciseChoice: typeof useExerciseChoice;
	useLedgerMutation: typeof useLedgerMutation;
	usePartyId: typeof usePartyId;
	useLedgerEnd: typeof useLedgerEnd;
	useSynchronizers: typeof useSynchronizers;
}

// ─── tanstackQueryPlugin ──────────────────────────────────────────────────────

/**
 * Plugin that adds TanStack Query hooks to the Nexus client.
 * Include this plugin in `createNexusClient()` to get `useContracts`,
 * `useCreateContract`, `useExerciseChoice`, and other hooks on the client
 * instance.
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
 * // In a component:
 * const { data } = nexus.useContracts({ templateId: "pkg:Mod:Iou" });
 * ```
 */
export function tanstackQueryPlugin(): NexusClientPlugin & {
	getActions: () => TanstackQueryActions;
} {
	return {
		id: "tanstack-query",
		getActions: () => ({
			useContracts,
			useContractsSuspense,
			useCreateContract,
			useExerciseChoice,
			useLedgerMutation,
			usePartyId,
			useLedgerEnd,
			useSynchronizers,
		}),
	};
}
