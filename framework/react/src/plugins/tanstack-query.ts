import { useEffect, useRef, useState } from "react";
import type {
	ActiveContract,
	ActiveContractsResponse,
	ActiveInterfacesResponse,
	CompletionEvent,
	ExerciseResult,
	LedgerEnd,
	NexusClient,
	NexusPlugin,
	SubmitResult,
	SynchronizerInfo,
	TemplateDescriptor,
	TemplateId,
	TransactionStatus,
} from "@nexus-framework/core";
import { toStableTemplateId } from "@nexus-framework/core";
import {
	type InfiniteData,
	type UseInfiniteQueryResult,
	type UseMutationResult,
	type UseQueryResult,
	type UseSuspenseQueryResult,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { invalidateContractQueries, nexusKeys } from "../query/query-keys.ts";
import {
	type ContractQueryOptionsParams,
	contractQueryOptions,
	fetchByIdOptions,
	fetchByKeyOptions,
	type InterfaceQueryOptionsParams,
	interfaceQueryOptions,
	ledgerEndQueryOptions,
	type PartyIdQueryOptionsParams,
	partyIdQueryOptions,
	synchronizersQueryOptions,
} from "../query/query-options.ts";

export interface UseContractsOptions<_T = Record<string, unknown>> {
	templateId: string | TemplateDescriptor;
	parties?: string[];
	filter?: Record<string, unknown>;
	fetchAll?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

export interface UseFetchOptions<_T = Record<string, unknown>> {
	templateId: string | TemplateDescriptor;
	contractId: string;
	parties?: string[];
	enabled?: boolean;
	staleTime?: number;
}

export interface UseFetchByKeyOptions<_T = Record<string, unknown>, K = unknown> {
	templateId: string | TemplateDescriptor;
	key: K;
	/** Function that returns true if the contract payload matches the key */
	keyPredicate: (payload: _T) => boolean;
	parties?: string[];
	enabled?: boolean;
	staleTime?: number;
}

export interface CreateContractVariables<T = Record<string, unknown>> {
	templateId: string | TemplateId | TemplateDescriptor;
	createArguments: T;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
}

export interface UseCreateContractOptions<
	T extends Record<string, unknown> = Record<string, unknown>,
> {
	invalidateTemplates?: Array<string | TemplateDescriptor>;
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
	/**
	 * Enable optimistic UI updates.
	 * - `true`: auto-infer payload from createArguments
	 * - function: provide a custom partial contract
	 */
	optimistic?: boolean | ((vars: CreateContractVariables<T>) => Partial<ActiveContract<T>>);
	/**
	 * @deprecated Use `optimistic` as a function instead.
	 */
	optimisticContract?: (vars: CreateContractVariables<T>) => Partial<ActiveContract<T>>;
	/** If true, wait for the transaction to be committed to the ledger before resolving. */
	waitForFinality?: boolean;
}

export interface ExerciseChoiceVariables<TArg = Record<string, unknown>> {
	templateId: string | TemplateId | TemplateDescriptor;
	contractId: string;
	choice: string;
	choiceArgument: TArg;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
}

export interface UseExerciseChoiceOptions {
	invalidateTemplates?: Array<string | TemplateDescriptor>;
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
	/** If true, wait for the transaction to be committed to the ledger before resolving. */
	waitForFinality?: boolean;
	/**
	 * Enable automatic optimistic UI updates.
	 * If true, Nexus will guess the update (e.g. remove on consuming archive).
	 * If a function is provided, it can return the partial contract update.
	 */
	optimistic?:
		| boolean
		| ((vars: ExerciseChoiceVariables) => Partial<ActiveContract<Record<string, unknown>>>);
}

export interface UseLedgerMutationOptions<TVariables = void> {
	mutationFn: (client: NexusClient, variables: TVariables) => Promise<SubmitResult>;
	invalidateTemplates?: Array<string | TemplateDescriptor>;
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
	/** If true, wait for the transaction to be committed to the ledger before resolving. */
	waitForFinality?: boolean;
}

// ─── Optimistic Updates Helpers ───────────────────────────────────────────

async function applyOptimisticUpdate<T = Record<string, unknown>>(
	queryClient: ReturnType<typeof useQueryClient>,
	queryKey: readonly unknown[],
	update: (prev: ActiveContractsResponse<T>) => ActiveContractsResponse<T>,
) {
	await queryClient.cancelQueries({ queryKey });
	const previousData = queryClient.getQueryData<ActiveContractsResponse<T>>(queryKey);

	if (previousData) {
		queryClient.setQueryData<ActiveContractsResponse<T>>(queryKey, update(previousData));
	}

	return previousData;
}

function rollbackOptimisticUpdate(
	queryClient: ReturnType<typeof useQueryClient>,
	queryKey: readonly unknown[] | undefined,
	previousData: unknown,
) {
	if (queryKey && previousData) {
		queryClient.setQueryData(queryKey as unknown[], previousData);
	}
}

// ─── NexusClientPlugin ────────────────────────────────────────────────────────

/**
 * Client-side plugin interface for extending the Nexus client with
 * React hooks and other browser-side capabilities.
 *
 * `getActions` receives the `NexusClient` instance directly — hooks
 * close over it, no React Context needed.
 */
export interface NexusClientPlugin<
	TContext extends Record<string, unknown> = Record<string, unknown>,
> {
	id: string;
	getActions?: (client: NexusClient) => Record<string, unknown>;
	onTokenRefreshed?: (newToken: string) => void | Promise<void>;
	$Infer?: TContext;
}

// ─── TanstackQueryActions ─────────────────────────────────────────────────────

// ─── ExerciseAndGetResult variables ──────────────────────────────────────────

export interface ExerciseAndGetResultVariables<
	TArg extends Record<string, unknown> = Record<string, unknown>,
> {
	templateId: string | TemplateDescriptor;
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
	interfaceId: string | TemplateDescriptor;
	parties?: string[];
	fetchAll?: boolean;
	includeCreateArguments?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

export interface UsePagedContractsOptions<_T = Record<string, unknown>> {
	templateId: string | TemplateDescriptor;
	parties?: string[];
	pageSize?: number;
	filter?: Record<string, unknown>;
}

// ─── Result types ─────────────────────────────────────────────────────────────

export type UseContractsResult<T = Record<string, unknown>> = UseQueryResult<
	ActiveContractsResponse<T>
> & {
	/** Always-defined array. Empty while loading, never undefined. */
	contracts: ActiveContract<T>[];
};

export type UseContractsSuspenseResult<T = Record<string, unknown>> = UseSuspenseQueryResult<
	ActiveContractsResponse<T>
> & {
	/** Always-defined array. Never undefined. */
	contracts: ActiveContract<T>[];
};

export type UsePagedContractsResult<T = Record<string, unknown>> = UseInfiniteQueryResult<
	InfiniteData<ActiveContractsResponse<T>>
> & {
	/** Flattened contracts across all loaded pages. Never undefined. */
	contracts: ActiveContract<T>[];
};

// ─── useCommandStatus ─────────────────────────────────────────────────────────

export type CommandStatusState =
	| { status: "idle" }
	| { status: "waiting" }
	| { status: "accepted"; updateId?: string; offset: number }
	| { status: "rejected"; errorMessage: string; code: number }
	| { status: "error"; error: Error };

export interface UseCommandStatusResult {
	/** Current processing state of the command */
	state: CommandStatusState;
	/** True while the completion stream WebSocket is open */
	connected: boolean;
	/** Manually close the stream (auto-closed on component unmount or accepted/rejected) */
	close: () => void;
}

// ─── useRightsAs ─────────────────────────────────────────────────────────────

/**
 * Result of `nexus.useRightsAs(party)` — a set of hooks pre-bound to the given party.
 * All contract queries will use `readAs` set to `[party]` unless overridden.
 */
export interface UseRightsAsResult {
	/**
	 * The effective party this scoped client reads as.
	 */
	readAsParty: string;
	/**
	 * Scoped contract query — automatically sets parties to [readAsParty].
	 */
	useContracts: <T = Record<string, unknown>>(
		options: Omit<UseContractsOptions<T>, "parties">,
	) => UseContractsResult<T>;
	/** Scoped Suspense contract query. */
	useContractsSuspense: <T = Record<string, unknown>>(
		options: Omit<UseContractsOptions<T>, "parties">,
	) => UseContractsSuspenseResult<T>;
	/** Scoped paged contract query. */
	usePagedContracts: <T = Record<string, unknown>>(
		options: Omit<UsePagedContractsOptions<T>, "parties">,
	) => UsePagedContractsResult<T>;
	/** Scoped fetch by ID. */
	useFetch: <T = Record<string, unknown>>(
		options: Omit<UseFetchOptions<T>, "parties">,
	) => UseQueryResult<ActiveContract<T> | undefined>;
	/** Scoped fetch by key. */
	useFetchByKey: <T = Record<string, unknown>, K = unknown>(
		options: Omit<UseFetchByKeyOptions<T, K>, "parties">,
	) => UseQueryResult<ActiveContract<T> | undefined>;
	/** Scoped interface query. */
	useInterface: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
		options: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
	) => UseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;
	/** Scoped Suspense interface query. */
	useInterfaceSuspense: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
		options: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
	) => UseSuspenseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;
}

export interface TanstackQueryActions extends Record<string, unknown> {
	optimistic?: {
		getUpdate: (
			templateId: string | TemplateId,
			choice: string,
			argument: unknown,
			contract: ActiveContract,
		) => Partial<ActiveContract> | null;
	};

	useContracts: <T = Record<string, unknown>>(
		options: UseContractsOptions<T>,
	) => UseContractsResult<T>;

	useContractsSuspense: <T = Record<string, unknown>>(
		options: UseContractsOptions<T>,
	) => UseContractsSuspenseResult<T>;

	/**
	 * Fetch a single contract by its ID.
	 */
	useFetch: <T = Record<string, unknown>>(
		options: UseFetchOptions<T>,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	/**
	 * Fetch a single contract by its Daml contract key.
	 */
	useFetchByKey: <T = Record<string, unknown>, K = unknown>(
		options: UseFetchByKeyOptions<T, K>,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	/**
	 * Paged contract query using infinite scrolling.
	 */
	usePagedContracts: <T = Record<string, unknown>>(
		options: UsePagedContractsOptions<T>,
	) => UsePagedContractsResult<T>;

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

	useCreateContract: <T extends Record<string, unknown> = Record<string, unknown>>(
		options?: UseCreateContractOptions<T>,
	) => UseMutationResult<SubmitResult, Error, CreateContractVariables<T>>;

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

	/**
	 * Check the status of a transaction on the ledger.
	 *
	 * @param transactionId Hex ID of the transaction to check
	 */
	useTransactionStatus: (transactionId: string | undefined) => UseQueryResult<TransactionStatus>;

	/**
	 * Track the lifecycle of a submitted command via the completions stream.
	 *
	 * Opens a WebSocket to `/v2/commands/completions` and emits status updates
	 * as the ledger processes the command. More reliable than polling `waitForTransaction`
	 * because it correlates via `submissionId`.
	 *
	 * @param commandId - The `commandId` used in the submission
	 * @param options.submissionId - The `submissionId` used in the submission (for precise matching)
	 * @param options.parties - Act-as parties to subscribe completions for
	 * @param options.fromOffset - Ledger offset before the submission (capture with `useLedgerEnd`)
	 */
	useCommandStatus: (
		commandId: string | undefined,
		options?: { submissionId?: string; parties?: string[]; fromOffset?: string | number },
	) => UseCommandStatusResult;

	/**
	 * Returns a scoped set of query hooks pre-bound to the given party as `readAs`.
	 * Equivalent to @c7-digital/react's `useRightsAs()` — useful for multi-party UIs
	 * where you want to switch perspective without threading `parties` everywhere.
	 */
	useRightsAs: (party: string) => UseRightsAsResult;

	/**
	 * Modern Query Options API (TRPC-style).
	 * Returns TanStack Query `queryOptions` objects for use with `useQuery`, `prefetchQuery`, etc.
	 */
	query: {
		contracts: <T = Record<string, unknown>>(
			params: ContractQueryOptionsParams<T>,
		) => ReturnType<typeof contractQueryOptions<T>>;
		interfaces: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
			params: InterfaceQueryOptionsParams<TView, TPayload>,
		) => ReturnType<typeof interfaceQueryOptions<TView, TPayload>>;
		ledgerEnd: () => ReturnType<typeof ledgerEndQueryOptions>;
		partyId: (params: PartyIdQueryOptionsParams) => ReturnType<typeof partyIdQueryOptions>;
		synchronizers: () => ReturnType<typeof synchronizersQueryOptions>;
	};
}

// ─── tanstackQueryPlugin ──────────────────────────────────────────────────────

/**
 * Plugin that adds TanStack Query hooks to the Nexus client.
 */
export function tanstackQueryPlugin(): NexusPlugin<{
	query: TanstackQueryActions["query"];
}> &
	NexusClientPlugin<{
		useContracts: TanstackQueryActions["useContracts"];
		useContractsSuspense: TanstackQueryActions["useContractsSuspense"];
		usePagedContracts: TanstackQueryActions["usePagedContracts"];
		useFetch: TanstackQueryActions["useFetch"];
		useFetchByKey: TanstackQueryActions["useFetchByKey"];
		useCreateContract: TanstackQueryActions["useCreateContract"];
		useExerciseChoice: TanstackQueryActions["useExerciseChoice"];
		useExerciseAndGetResult: TanstackQueryActions["useExerciseAndGetResult"];
		useRightsAsResult: TanstackQueryActions["useRightsAsResult"];
	}> {
	return {
		id: "tanstack-query",

		// Core calls this — works on both server and client (React-free)
		init: (client) => ({
			query: {
				contracts: <T = Record<string, unknown>>(params: ContractQueryOptionsParams<T>) =>
					contractQueryOptions<T>({ client, ...params }),
				interfaces: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
					params: InterfaceQueryOptionsParams<TView, TPayload>,
				) => interfaceQueryOptions<TView, TPayload>({ client, ...params }),
				ledgerEnd: () => ledgerEndQueryOptions({ client }),
				partyId: (params: PartyIdQueryOptionsParams) => partyIdQueryOptions({ client, ...params }),
				synchronizers: () => synchronizersQueryOptions({ client }),
			},
		}),

		getActions: (client): TanstackQueryActions => ({
			// ─── Contract Queries ────────────────────────────────────────────────

			useContracts: <T = Record<string, unknown>>(
				opts: UseContractsOptions<T>,
			): UseContractsResult<T> => {
				const result = useQuery(contractQueryOptions<T>({ client, ...opts }));
				return { ...result, contracts: result.data?.contracts ?? [] } as UseContractsResult<T>;
			},

			useContractsSuspense: <T = Record<string, unknown>>(
				opts: UseContractsOptions<T>,
			): UseContractsSuspenseResult<T> => {
				const result = useSuspenseQuery(contractQueryOptions<T>({ client, ...opts }));
				return {
					...result,
					contracts: result.data?.contracts ?? [],
				} as UseContractsSuspenseResult<T>;
			},

			useFetch: <T = Record<string, unknown>>(opts: UseFetchOptions<T>) =>
				useQuery(fetchByIdOptions<T>({ client, ...opts })),

			useFetchByKey: <T = Record<string, unknown>, K = unknown>(opts: UseFetchByKeyOptions<T, K>) =>
				useQuery(fetchByKeyOptions<T, K>({ client, ...opts })),

			usePagedContracts: <T = Record<string, unknown>>(
				opts: UsePagedContractsOptions<T>,
			): UsePagedContractsResult<T> => {
				const stableId = toStableTemplateId(opts.templateId);

				const result = useInfiniteQuery({
					queryKey: nexusKeys.contractsQuery(stableId, {
						parties: opts.parties,
						filter: opts.filter,
						pageSize: opts.pageSize,
					}),
					queryFn: async ({ pageParam }) => {
						return client.ledger.contracts.fetchActiveContracts<T>({
							templateId: opts.templateId,
							parties: opts.parties,
							filter: opts.filter,
							pageSize: opts.pageSize ?? 50,
							pageToken: pageParam as string | undefined,
						});
					},
					initialPageParam: undefined as string | undefined,
					getNextPageParam: (lastPage) => lastPage.nextPageToken,
				});

				return {
					...result,
					contracts: result.data?.pages.flatMap((p) => p.contracts) ?? [],
				} as UsePagedContractsResult<T>;
			},

			// ─── Interface Queries ───────────────────────────────────────────────

			useInterface: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
				opts: UseInterfaceOptions<TView, TPayload>,
			) => useQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts })),

			useInterfaceSuspense: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
				opts: UseInterfaceOptions<TView, TPayload>,
			) => useSuspenseQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts })),

			// ─── Ledger State ────────────────────────────────────────────────────

			usePartyId: (userId: string) => useQuery(partyIdQueryOptions({ client, userId })),

			useLedgerEnd: () => useQuery(ledgerEndQueryOptions({ client })),

			useSynchronizers: () => useQuery(synchronizersQueryOptions({ client })),

			useTransactionStatus: (transactionId: string | undefined) => {
				return useQuery({
					queryKey: nexusKeys.transactionStatus(transactionId ?? ""),
					queryFn: async ({ signal }) => {
						if (!transactionId) return "pending";
						try {
							await client.http.waitForTransaction(transactionId, {
								timeoutMs: 10000,
								signal,
							});
							return "finalized";
						} catch (err) {
							if (String(err).includes("aborted")) return "pending";
							return "failed";
						}
					},
					enabled: !!transactionId,
					placeholderData: "pending",
					refetchInterval: (query) => (query.state.data === "finalized" ? false : 1000),
				});
			},

			useCommandStatus: (
			commandId: string | undefined,
			options?: { submissionId?: string; parties?: string[]; fromOffset?: string | number },
		): UseCommandStatusResult => {
			const [state, setState] = useState<CommandStatusState>(
				commandId ? { status: "waiting" } : { status: "idle" },
			);
			const [connected, setConnected] = useState(false);
			// Store only the close function — avoids TS property issues
			const closeRef = useRef<(() => void) | null>(null);
			const partiesKey = JSON.stringify(options?.parties ?? []);

			useEffect(() => {
				if (!commandId) {
					setState({ status: "idle" });
					return;
				}

				setState({ status: "waiting" });
				let cancelled = false;

				const open = async () => {
					const fromOffset = options?.fromOffset ?? (await client.http.getLedgerEnd()).offset;
					const parties = options?.parties ?? [];

					if (cancelled) return;

					const handle = await client.http.streamCompletions(parties, fromOffset, {
						onCompletion: (event: CompletionEvent) => {
							if (event.commandId !== commandId) return;
							if (options?.submissionId && event.submissionId !== options.submissionId) return;

							if (event.status === 0) {
								setState({ status: "accepted", updateId: event.updateId, offset: event.offset });
							} else {
								setState({
									status: "rejected",
									errorMessage: event.errorMessage ?? "Command rejected by ledger",
									code: event.status,
								});
							}
							handle.close();
						},
						onError: (err: Error) => {
							setState({ status: "error", error: err });
						},
						onClose: () => setConnected(false),
					});

					if (cancelled) {
						handle.close();
						return;
					}

					setConnected(handle.connected);
					closeRef.current = () => handle.close();
				};

				open().catch((err: unknown) => {
					if (!cancelled) setState({ status: "error", error: err as Error });
				});

				return () => {
					cancelled = true;
					closeRef.current?.();
					closeRef.current = null;
				};
			// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [commandId, options?.submissionId, options?.fromOffset, partiesKey]);

			return { state, connected, close: () => closeRef.current?.() };
		},

		// ─── Mutations ──────────────────────────────────────────────────────

			useCreateContract: <T extends Record<string, unknown> = Record<string, unknown>>(
				opts: UseCreateContractOptions<T> = {},
			) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: async (vars: CreateContractVariables<T>) => {
						const result = await client.ledger.commands.createContract(
							vars.templateId,
							vars.createArguments,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						);

						if (opts.waitForFinality) {
							await client.http.waitForTransaction(result.updateId);
						}

						return result;
					},
					onMutate: async (vars) => {
						if (!opts.optimistic && !opts.optimisticContract) return;

						const stableTemplateId = toStableTemplateId(vars.templateId);

						const parties = [...vars.actAs, ...(vars.readAs ?? [])];
						const queryKey = nexusKeys.contractsQuery(stableTemplateId, { parties });

						const previousData = await applyOptimisticUpdate<T>(queryClient, queryKey, (prev) => {
							const optimisticSub =
								typeof opts.optimistic === "function"
									? opts.optimistic(vars)
									: (opts.optimisticContract?.(vars) ?? {});
							return {
								...prev,
								contracts: [
									{
										contractId: `optimistic-${Date.now()}`,
										templateId: vars.templateId as TemplateId,
										signatories: vars.actAs,
										observers: vars.readAs ?? [],
										createdAt: new Date().toISOString(),
										isOptimistic: true,
										payload: vars.createArguments as unknown as T,
										...optimisticSub,
									} as ActiveContract<T>,
									...prev.contracts,
								],
							};
						});

						return { previousData, queryKey };
					},
					onError: (err, _vars, context) => {
						const ctx = context as { queryKey?: readonly unknown[]; previousData?: unknown };
						rollbackOptimisticUpdate(queryClient, ctx?.queryKey, ctx?.previousData);
						opts.onError?.(err);
					},
					onSuccess: async (result, vars) => {
						if (opts.waitForFinality) {
							await client.http.waitForTransaction(result.updateId);
						}

						const templateId = toStableTemplateId(vars.templateId);

						const templates =
							opts.invalidateTemplates ?? ([templateId] as Array<string | TemplateDescriptor>);
						const stableTemplates = templates.map((t) => toStableTemplateId(t));
						await invalidateContractQueries(queryClient, stableTemplates);
						await opts.onSuccess?.(result);
					},
				});
			},

			useExerciseChoice: (opts: UseExerciseChoiceOptions = {}) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: async (vars: ExerciseChoiceVariables) => {
						return client.ledger.commands.exerciseChoice(
							vars.templateId,
							vars.contractId,
							vars.choice,
							vars.choiceArgument,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						);
					},
					onMutate: async (vars) => {
						if (opts.optimistic === false) return;

						const stableTemplateId = toStableTemplateId(vars.templateId);

						const parties = [...vars.actAs, ...(vars.readAs ?? [])];
						const queryKey = nexusKeys.contractsQuery(stableTemplateId, { parties });

						const previousData = await applyOptimisticUpdate(queryClient, queryKey, (prev) => {
							const contract = prev.contracts.find((c) => c.contractId === vars.contractId);
							if (!contract) return prev;

							// 1. Explicit inline function takes precedence
							if (typeof opts.optimistic === "function") {
								const update = opts.optimistic(vars);
								return {
									...prev,
									contracts: prev.contracts.map((c) =>
										c.contractId === vars.contractId ? { ...c, ...update, isOptimistic: true } : c,
									),
								};
							}

							// 2. Archive auto-logic
							if (vars.choice.toLowerCase().includes("archive")) {
								return {
									...prev,
									contracts: prev.contracts.filter((c) => c.contractId !== vars.contractId),
								};
							}

							// 3. Declarative plugin logic (optimisticUiPlugin)
							const clientWithOptimistic = client as NexusClient & {
								optimistic?: TanstackQueryActions["optimistic"];
							};
							if (clientWithOptimistic.optimistic) {
								const pluginUpdate = clientWithOptimistic.optimistic.getUpdate(
									stableTemplateId,
									vars.choice,
									vars.choiceArgument,
									contract,
								);
								if (pluginUpdate) {
									return {
										...prev,
										contracts: prev.contracts.map((c) =>
											c.contractId === vars.contractId
												? { ...c, ...pluginUpdate, isOptimistic: true }
												: c,
										),
									};
								}
							}

							return prev;
						});

						return { previousData, queryKey };
					},
					onSuccess: async (result, vars) => {
						if (opts.waitForFinality) {
							await client.http.waitForTransaction(result.updateId);
						}

						const templateId = toStableTemplateId(vars.templateId);

						const templates =
							opts.invalidateTemplates ?? ([templateId] as Array<string | TemplateDescriptor>);
						const stableTemplates = templates.map((t) => toStableTemplateId(t));
						await invalidateContractQueries(queryClient, stableTemplates);
						await opts.onSuccess?.(result);
					},
					onError: (err, _vars, context) => {
						const ctx = context as { queryKey?: readonly unknown[]; previousData?: unknown };
						rollbackOptimisticUpdate(queryClient, ctx?.queryKey, ctx?.previousData);
						opts.onError?.(err);
					},
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
					mutationFn: async (vars: ExerciseAndGetResultVariables<TArg>) => {
						return client.ledger.commands.exerciseAndGetResult<TArg, TResult>(
							vars.templateId,
							vars.contractId,
							vars.choice,
							vars.choiceArgument,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						);
					},
					onSuccess: async (result, vars) => {
						const templates = opts.invalidateTemplates ??
							vars.invalidateTemplates ?? [vars.templateId];

						const stableTemplates = templates.map((t) => toStableTemplateId(t));
						await invalidateContractQueries(queryClient, stableTemplates);
						await opts.onSuccess?.(result);
					},
					onError: opts.onError,
				});
			},

			useLedgerMutation: <TVariables = void>(opts: UseLedgerMutationOptions<TVariables>) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: (vars: TVariables) => opts.mutationFn(client, vars),
					onSuccess: async (result, _vars) => {
						if (opts.waitForFinality) {
							await client.http.waitForTransaction(result.updateId);
						}

						if (opts.invalidateTemplates && opts.invalidateTemplates.length > 0) {
							const stableTemplates = opts.invalidateTemplates.map((t) => toStableTemplateId(t));
							await invalidateContractQueries(queryClient, stableTemplates);
						}
						await opts.onSuccess?.(result);
					},
					onError: opts.onError,
				});
			},

			// ─── useRightsAs ──────────────────────────────────────────────────────

			useRightsAs: (party: string): UseRightsAsResult => ({
				readAsParty: party,
				useContracts: <T = Record<string, unknown>>(
					opts: Omit<UseContractsOptions<T>, "parties">,
				): UseContractsResult<T> => {
					const result = useQuery(contractQueryOptions<T>({ client, ...opts, parties: [party] }));
					return { ...result, contracts: result.data?.contracts ?? [] } as UseContractsResult<T>;
				},
				useContractsSuspense: <T = Record<string, unknown>>(
					opts: Omit<UseContractsOptions<T>, "parties">,
				): UseContractsSuspenseResult<T> => {
					const result = useSuspenseQuery(
						contractQueryOptions<T>({ client, ...opts, parties: [party] }),
					);
					return {
						...result,
						contracts: result.data?.contracts ?? [],
					} as UseContractsSuspenseResult<T>;
				},
				usePagedContracts: <T = Record<string, unknown>>(
					opts: Omit<UsePagedContractsOptions<T>, "parties">,
				): UsePagedContractsResult<T> => {
					const stableId = toStableTemplateId(opts.templateId);

					const result = useInfiniteQuery({
						queryKey: nexusKeys.contractsQuery(stableId, {
							parties: [party],
							filter: opts.filter,
							pageSize: opts.pageSize,
						}),
						queryFn: async ({ pageParam }) => {
							return client.ledger.contracts.fetchActiveContracts<T>({
								templateId: opts.templateId,
								parties: [party],
								filter: opts.filter,
								pageSize: opts.pageSize,
								pageToken: pageParam as string | undefined,
							});
						},
						initialPageParam: undefined as string | undefined,
						getNextPageParam: (lastPage) => lastPage.nextPageToken,
					});

					return {
						...result,
						contracts: result.data?.pages.flatMap((p) => p.contracts) ?? [],
					} as UsePagedContractsResult<T>;
				},
				useFetch: <T = Record<string, unknown>>(opts: Omit<UseFetchOptions<T>, "parties">) =>
					useQuery(fetchByIdOptions<T>({ client, ...opts, parties: [party] })),
				useFetchByKey: <T = Record<string, unknown>, K = unknown>(
					opts: Omit<UseFetchByKeyOptions<T, K>, "parties">,
				) => useQuery(fetchByKeyOptions<T, K>({ client, ...opts, parties: [party] })),
				useInterface: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
					opts: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
				) =>
					useQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts, parties: [party] })),
				useInterfaceSuspense: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
					opts: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
				) =>
					useSuspenseQuery(
						interfaceQueryOptions<TView, TPayload>({ client, ...opts, parties: [party] }),
					),
			}),

			query: {
				contracts: <T = Record<string, unknown>>(params: ContractQueryOptionsParams<T>) =>
					contractQueryOptions<T>({ client, ...params }),
				interfaces: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
					params: InterfaceQueryOptionsParams<TView, TPayload>,
				) => interfaceQueryOptions<TView, TPayload>({ client, ...params }),
				ledgerEnd: () => ledgerEndQueryOptions({ client }),
				partyId: (params: PartyIdQueryOptionsParams) => partyIdQueryOptions({ client, ...params }),
				synchronizers: () => synchronizersQueryOptions({ client }),
			},
		}),
	};
}
