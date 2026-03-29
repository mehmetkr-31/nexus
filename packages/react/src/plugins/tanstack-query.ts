import type {
	ActiveContractsResponse,
	ActiveInterfacesResponse,
	ExerciseResult,
	LedgerEnd,
	NexusClient,
	SubmitResult,
	SynchronizerInfo,
} from "@nexus-framework/core";
import {
	type UseMutationResult,
	type UseQueryResult,
	type UseSuspenseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { invalidateContractQueries } from "../query/query-keys.ts";
import {
	contractQueryOptions,
	interfaceQueryOptions,
	ledgerEndQueryOptions,
	partyIdQueryOptions,
	synchronizersQueryOptions,
} from "../query/query-options.ts";


import type { TemplateId } from "@nexus-framework/core";

export interface UseContractsOptions<T = Record<string, unknown>> {
	templateId: string;
	parties?: string[];
	filter?: Record<string, unknown>;
	fetchAll?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

export interface CreateContractVariables<T = Record<string, unknown>> {
	templateId: string | TemplateId;
	createArguments: T;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
}

export interface UseCreateContractOptions {
	invalidateTemplates?: string[];
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
}

export interface ExerciseChoiceVariables<TArg = Record<string, unknown>> {
	templateId: string | TemplateId;
	contractId: string;
	choice: string;
	choiceArgument: TArg;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
}

export interface UseExerciseChoiceOptions {
	invalidateTemplates?: string[];
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
}

export interface UseLedgerMutationOptions<TVariables = void> {
	mutationFn: (client: NexusClient, variables: TVariables) => Promise<SubmitResult>;
	invalidateTemplates?: string[];
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
}

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

// ─── ExerciseAndGetResult variables ──────────────────────────────────────────

export interface ExerciseAndGetResultVariables<
	TArg extends Record<string, unknown> = Record<string, unknown>,
> {
	templateId: string;
	contractId: string;
	choice: string;
	choiceArgument: TArg;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
	invalidateTemplates?: string[];
}

export interface UseExerciseAndGetResultOptions<TResult = unknown> {
	onSuccess?: (result: ExerciseResult<TResult>) => Promise<void> | void;
	onError?: (error: Error) => void;
	invalidateTemplates?: string[];
}

// ─── Interface query options ──────────────────────────────────────────────────

export interface UseInterfaceOptions<
	_TView = Record<string, unknown>,
	_TPayload = Record<string, unknown>,
> {
	interfaceId: string;
	parties?: string[];
	fetchAll?: boolean;
	includeCreateArguments?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

// ─── TanstackQueryActions ─────────────────────────────────────────────────────

export interface TanstackQueryActions extends Record<string, unknown> {
	useContracts: <T = Record<string, unknown>>(
		options: UseContractsOptions<T>,
	) => UseQueryResult<ActiveContractsResponse<T>>;

	useContractsSuspense: <T = Record<string, unknown>>(
		options: UseContractsOptions<T>,
	) => UseSuspenseQueryResult<ActiveContractsResponse<T>>;

	/**
	 * Query contracts through a Daml interface — returns interfaceView + payload.
	 */
	useInterface: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
		options: UseInterfaceOptions<TView, TPayload>,
	) => UseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;

	/**
	 * Suspense variant of useInterface.
	 */
	useInterfaceSuspense: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
		options: UseInterfaceOptions<TView, TPayload>,
	) => UseSuspenseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;

	useCreateContract: (
		options?: UseCreateContractOptions,
	) => UseMutationResult<SubmitResult, Error, CreateContractVariables>;

	useExerciseChoice: (
		options?: UseExerciseChoiceOptions,
	) => UseMutationResult<SubmitResult, Error, ExerciseChoiceVariables>;

	/**
	 * Exercise a Daml choice and get back the typed return value from the ledger.
	 * Use this when you need `exerciseResult` from the choice.
	 */
	useExerciseAndGetResult: <
		TArg extends Record<string, unknown> = Record<string, unknown>,
		TResult = unknown,
	>(
		options?: UseExerciseAndGetResultOptions<TResult>,
	) => UseMutationResult<ExerciseResult<TResult>, Error, ExerciseAndGetResultVariables<TArg>>;

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
			// ─── Contract Queries ────────────────────────────────────────────────

			useContracts: <T = Record<string, unknown>>(opts: UseContractsOptions<T>) =>
				useQuery(contractQueryOptions<T>({ client, ...opts })),

			useContractsSuspense: <T = Record<string, unknown>>(opts: UseContractsOptions<T>) =>
				useSuspenseQuery(contractQueryOptions<T>({ client, ...opts })),

			// ─── Interface Queries ───────────────────────────────────────────────

			useInterface: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
				opts: UseInterfaceOptions<TView, TPayload>,
			) => useQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts })),

			useInterfaceSuspense: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
				opts: UseInterfaceOptions<TView, TPayload>,
			) => useSuspenseQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts })),

			// ─── Ledger State ────────────────────────────────────────────────────

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

			useExerciseAndGetResult: <
				TArg extends Record<string, unknown> = Record<string, unknown>,
				TResult = unknown,
			>(
				opts: UseExerciseAndGetResultOptions<TResult> = {},
			) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: (vars: ExerciseAndGetResultVariables<TArg>) =>
						client.ledger.commands.exerciseAndGetResult<TArg, TResult>(
							vars.templateId,
							vars.contractId,
							vars.choice,
							vars.choiceArgument,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						),
					onSuccess: async (result, vars) => {
						const templates = opts.invalidateTemplates ??
							vars.invalidateTemplates ?? [vars.templateId];
						await invalidateContractQueries(queryClient, templates);
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
