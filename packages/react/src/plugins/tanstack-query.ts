import type { NexusClient, SubmitResult } from "@nexus-framework/core";
import {
	type UseMutationResult,
	type UseQueryResult,
	type UseSuspenseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { UseContractsOptions } from "../hooks/use-contracts.ts";
import type {
	CreateContractVariables,
	ExerciseChoiceVariables,
	UseCreateContractOptions,
	UseExerciseChoiceOptions,
	UseLedgerMutationOptions,
} from "../hooks/use-submit.ts";
import type { ActiveContractsResponse, LedgerEnd, SynchronizerInfo } from "@nexus-framework/core";
import { invalidateContractQueries } from "../query/query-keys.ts";
import {
	contractQueryOptions,
	ledgerEndQueryOptions,
	partyIdQueryOptions,
	synchronizersQueryOptions,
} from "../query/query-options.ts";

// ─── NexusClientPlugin ────────────────────────────────────────────────────────

/**
 * Client-side plugin interface for extending the Nexus client with
 * React hooks and other browser-side capabilities.
 *
 * `getActions` receives the `NexusClient` instance directly — hooks
 * close over it, no React Context needed.
 */
export interface NexusClientPlugin {
	id: string;
	getActions?: (client: NexusClient) => Record<string, unknown>;
}

// ─── TanstackQueryActions ─────────────────────────────────────────────────────

export interface TanstackQueryActions extends Record<string, unknown> {
	useContracts: <T = Record<string, unknown>>(
		options: UseContractsOptions<T>,
	) => UseQueryResult<ActiveContractsResponse<T>>;

	useContractsSuspense: <T = Record<string, unknown>>(
		options: UseContractsOptions<T>,
	) => UseSuspenseQueryResult<ActiveContractsResponse<T>>;

	useCreateContract: (
		options?: UseCreateContractOptions,
	) => UseMutationResult<SubmitResult, Error, CreateContractVariables>;

	useExerciseChoice: (
		options?: UseExerciseChoiceOptions,
	) => UseMutationResult<SubmitResult, Error, ExerciseChoiceVariables>;

	useLedgerMutation: <TVariables = void>(
		options: UseLedgerMutationOptions<TVariables>,
	) => UseMutationResult<SubmitResult, Error, TVariables>;

	usePartyId: (userId: string) => UseQueryResult<string>;

	useLedgerEnd: () => UseQueryResult<LedgerEnd>;

	useSynchronizers: () => UseQueryResult<SynchronizerInfo[]>;
}

// ─── tanstackQueryPlugin ──────────────────────────────────────────────────────

/**
 * Plugin that adds TanStack Query hooks to the Nexus client.
 *
 * Hooks close over the `NexusClient` instance directly — no React Context
 * needed. Only a `QueryClientProvider` is required in the component tree.
 *
 * @example
 * ```ts
 * const nexus = createNexusClient({
 *   baseUrl: "http://localhost:7575",
 *   plugins: [
 *     sandboxAuth({ userId: "alice", secret: "secret", partyId: "Alice::..." }),
 *     tanstackQueryPlugin(),
 *   ],
 * });
 *
 * // In a component (no NexusProvider needed — only QueryClientProvider):
 * const { data } = nexus.useContracts({ templateId: "pkg:Mod:Iou" });
 * ```
 */
export function tanstackQueryPlugin(): NexusClientPlugin {
	return {
		id: "tanstack-query",

		getActions: (client): TanstackQueryActions => ({
			// ─── Queries ────────────────────────────────────────────────────────

			useContracts: <T = Record<string, unknown>>(opts: UseContractsOptions<T>) =>
				useQuery(contractQueryOptions<T>({ client, ...opts })),

			useContractsSuspense: <T = Record<string, unknown>>(opts: UseContractsOptions<T>) =>
				useSuspenseQuery(contractQueryOptions<T>({ client, ...opts })),

			usePartyId: (userId: string) => useQuery(partyIdQueryOptions(client, userId)),

			useLedgerEnd: () => useQuery(ledgerEndQueryOptions(client)),

			useSynchronizers: () => useQuery(synchronizersQueryOptions(client)),

			// ─── Mutations ──────────────────────────────────────────────────────

			useCreateContract: (opts: UseCreateContractOptions = {}) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: (vars: CreateContractVariables) =>
						client.ledger.commands.createContract(
							vars.templateId,
							vars.createArguments,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						),
					onSuccess: async (result, vars) => {
						const templateId =
							typeof vars.templateId === "string"
								? vars.templateId
								: `${vars.templateId.packageId}:${vars.templateId.moduleName}:${vars.templateId.entityName}`;
						await invalidateContractQueries(queryClient, opts.invalidateTemplates ?? [templateId]);
						await opts.onSuccess?.(result);
					},
					onError: opts.onError,
				});
			},

			useExerciseChoice: (opts: UseExerciseChoiceOptions = {}) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: (vars: ExerciseChoiceVariables) =>
						client.ledger.commands.exerciseChoice(
							vars.templateId,
							vars.contractId,
							vars.choice,
							vars.choiceArgument,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						),
					onSuccess: async (result, vars) => {
						const templateId =
							typeof vars.templateId === "string"
								? vars.templateId
								: `${vars.templateId.packageId}:${vars.templateId.moduleName}:${vars.templateId.entityName}`;
						await invalidateContractQueries(queryClient, opts.invalidateTemplates ?? [templateId]);
						await opts.onSuccess?.(result);
					},
					onError: opts.onError,
				});
			},

			useLedgerMutation: <TVariables = void>(opts: UseLedgerMutationOptions<TVariables>) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: (vars: TVariables) => opts.mutationFn(client, vars),
					onSuccess: async (result) => {
						if (opts.invalidateTemplates?.length) {
							await invalidateContractQueries(queryClient, opts.invalidateTemplates);
						}
						await opts.onSuccess?.(result);
					},
					onError: opts.onError,
				});
			},
		}),
	};
}
