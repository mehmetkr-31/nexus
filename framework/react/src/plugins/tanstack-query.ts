import type {
	ActiveContract,
	ActiveContractsResponse,
	ActiveInterfacesResponse,
	CompletionEvent,
	DamlChoice,
	ExerciseResult,
	LedgerEnd,
	NexusClient,
	NexusPlugin,
	NexusTemplateIdentifier,
	SubmitResult,
	SynchronizerInfo,
	TemplateDescriptor,
	TemplateId,
	TransactionStatus,
} from "@nexus-framework/core";
import { DEFAULT_PAGE_SIZE, toStableTemplateId } from "@nexus-framework/core";
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
import { useEffect, useRef, useState } from "react";
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
	pagedContractsQueryOptions,
	type PagedContractsQueryOptionsParams,
	synchronizersQueryOptions,
	transactionStatusQueryOptions,
} from "../query/query-options.ts";

export interface UseContractsOptions<_T = unknown> {
	templateId: NexusTemplateIdentifier;
	parties?: string[];
	filter?: Record<string, unknown>;
	fetchAll?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

export interface UseFetchOptions<_T = unknown> {
	templateId: NexusTemplateIdentifier;
	contractId: string;
	parties?: string[];
	enabled?: boolean;
	staleTime?: number;
}

export interface UseFetchByKeyOptions<T = unknown> {
	templateId: NexusTemplateIdentifier;
	/** The exact Daml contract key value — passed to `POST /v2/contracts/contract-by-key`. */
	key: Record<string, unknown>;
	parties?: string[];
	enabled?: boolean;
	staleTime?: number;
}

export interface CreateContractVariables<T = unknown> {
	templateId: NexusTemplateIdentifier;
	createArguments: T;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
	invalidateTemplates?: Array<NexusTemplateIdentifier>;
}

export interface UseCreateContractOptions<T = unknown> {
	invalidateTemplates?: Array<NexusTemplateIdentifier>;
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
	/**
	 * Optional optimistic update function.
	 * Returns a partial contract payload to merge into the cache.
	 */
	optimistic?: boolean | ((vars: CreateContractVariables<T>) => Partial<ActiveContract<T>>);
	/**
	 * @deprecated Use `optimistic` as a function instead.
	 */
	optimisticContract?: (vars: CreateContractVariables<T>) => Partial<ActiveContract<T>>;
	/** If true, wait for the transaction to be committed to the ledger before resolving. */
	waitForFinality?: boolean;
}

export interface ExerciseChoiceVariables<TArg = unknown> {
	templateId: NexusTemplateIdentifier;
	contractId: string;
	choice: string | DamlChoice<unknown, TArg, unknown, unknown>;
	choiceArgument: TArg;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
}

export interface UseExerciseChoiceOptions {
	invalidateTemplates?: Array<NexusTemplateIdentifier>;
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
		| ((vars: ExerciseChoiceVariables<unknown>) => Partial<ActiveContract<unknown>>);
}

export interface UseLedgerMutationOptions<TVariables = void> {
	mutationFn: (client: NexusClient, variables: TVariables) => Promise<SubmitResult>;
	invalidateTemplates?: Array<NexusTemplateIdentifier>;
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
	/** If true, wait for the transaction to be committed to the ledger before resolving. */
	waitForFinality?: boolean;
}

// ─── Optimistic Updates Helpers ───────────────────────────────────────────

async function applyOptimisticUpdate<T = unknown>(
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

export interface ExerciseAndGetResultVariables<TArg = unknown, TResult = unknown> {
	templateId: NexusTemplateIdentifier;
	contractId: string;
	choice: string | DamlChoice<unknown, TArg, TResult, unknown>;
	choiceArgument: TArg;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
	invalidateTemplates?: Array<NexusTemplateIdentifier>;
}

export interface UseExerciseAndGetResultOptions<TResult = unknown> {
	onSuccess?: (result: ExerciseResult<TResult>) => Promise<void> | void;
	onError?: (error: Error) => void;
	invalidateTemplates?: Array<NexusTemplateIdentifier>;
}

export interface UseInterfaceOptions<_TView = unknown, _TPayload = unknown> {
	interfaceId: string | TemplateDescriptor;
	parties?: string[];
	fetchAll?: boolean;
	includeCreateArguments?: boolean;
	enabled?: boolean;
	staleTime?: number;
}

export interface UsePagedContractsOptions<_T = unknown> {
	templateId: NexusTemplateIdentifier;
	parties?: string[];
	pageSize?: number;
	filter?: Record<string, unknown>;
}

// ─── Result types ─────────────────────────────────────────────────────────────

export type UseContractsResult<T = unknown> = UseQueryResult<ActiveContractsResponse<T>> & {
	/** Always-defined array. Empty while loading, never undefined. */
	contracts: ActiveContract<T>[];
};

export type UseContractsSuspenseResult<T = unknown> = UseSuspenseQueryResult<
	ActiveContractsResponse<T>
> & {
	/** Always-defined array. Never undefined. */
	contracts: ActiveContract<T>[];
};

export type UsePagedContractsResult<T = unknown> = UseInfiniteQueryResult<
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

/**
 * Result of `nexus.useRightsAs(party)` — a set of hooks pre-bound to the given party.
 */
export interface UseRightsAsResult {
	readAsParty: string;
	useContracts: <T = unknown>(
		options: Omit<UseContractsOptions<T>, "parties">,
	) => UseContractsResult<T>;
	useContractsSuspense: <T = unknown>(
		options: Omit<UseContractsOptions<T>, "parties">,
	) => UseContractsSuspenseResult<T>;
	usePagedContracts: <T = unknown>(
		options: Omit<UsePagedContractsOptions<T>, "parties">,
	) => UsePagedContractsResult<T>;
	useFetch: <T = unknown>(
		options: Omit<UseFetchOptions<T>, "parties">,
	) => UseQueryResult<ActiveContract<T> | undefined>;
	useFetchByKey: <T = unknown>(
		options: Omit<UseFetchByKeyOptions<T>, "parties">,
	) => UseQueryResult<ActiveContract<T> | undefined>;
	useInterface: <TView = unknown, TPayload = unknown>(
		options: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
	) => UseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;
	useInterfaceSuspense: <TView = unknown, TPayload = unknown>(
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

	useContracts: <T = unknown>(options: UseContractsOptions<T>) => UseContractsResult<T>;

	useContractsSuspense: <T = unknown>(
		options: UseContractsOptions<T>,
	) => UseContractsSuspenseResult<T>;

	useFetch: <T = unknown>(
		options: UseFetchOptions<T>,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	useFetchByKey: <T = unknown>(
		options: UseFetchByKeyOptions<T>,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	usePagedContracts: <T = unknown>(
		options: UsePagedContractsOptions<T>,
	) => UsePagedContractsResult<T>;

	useInterface: <TView = unknown, TPayload = unknown>(
		options: UseInterfaceOptions<TView, TPayload>,
	) => UseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;

	useInterfaceSuspense: <TView = unknown, TPayload = unknown>(
		options: UseInterfaceOptions<TView, TPayload>,
	) => UseSuspenseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;

	useCreateContract: <T = unknown>(
		options?: UseCreateContractOptions<T>,
	) => UseMutationResult<SubmitResult, Error, CreateContractVariables<T>>;

	useExerciseChoice: (
		options?: UseExerciseChoiceOptions,
	) => UseMutationResult<SubmitResult, Error, ExerciseChoiceVariables>;

	useExerciseAndGetResult: <TArg = unknown, TResult = unknown>(
		options?: UseExerciseAndGetResultOptions<TResult>,
	) => UseMutationResult<
		ExerciseResult<TResult>,
		Error,
		ExerciseAndGetResultVariables<TArg, TResult>
	>;

	useLedgerMutation: <TVariables = void>(
		options: UseLedgerMutationOptions<TVariables>,
	) => UseMutationResult<SubmitResult, Error, TVariables>;

	usePartyId: (userId: string) => UseQueryResult<string>;
	useLedgerEnd: () => UseQueryResult<LedgerEnd>;
	useSynchronizers: () => UseQueryResult<SynchronizerInfo[]>;
	useTransactionStatus: (transactionId: string | undefined) => UseQueryResult<TransactionStatus>;
	useCommandStatus: (
		commandId: string | undefined,
		options?: { submissionId?: string; parties?: string[]; fromOffset?: string | number },
	) => UseCommandStatusResult;
	useRightsAs: (party: string) => UseRightsAsResult;

	query: {
		contracts: <T = unknown>(
			params: ContractQueryOptionsParams<T>,
		) => ReturnType<typeof contractQueryOptions<T>>;
		pagedContracts: <T = unknown>(
			params: PagedContractsQueryOptionsParams<T>,
		) => ReturnType<typeof pagedContractsQueryOptions<T>>;
		contractById: <T = unknown>(params: {
			templateId: NexusTemplateIdentifier;
			contractId: string;
			parties?: string[];
			enabled?: boolean;
			staleTime?: number;
		}) => ReturnType<typeof fetchByIdOptions<T>>;
		contractByKey: <T = unknown>(params: {
			templateId: NexusTemplateIdentifier;
			key: Record<string, unknown>;
			parties?: string[];
			enabled?: boolean;
			staleTime?: number;
		}) => ReturnType<typeof fetchByKeyOptions<T>>;
		interfaces: <TView = unknown, TPayload = unknown>(
			params: InterfaceQueryOptionsParams<TView, TPayload>,
		) => ReturnType<typeof interfaceQueryOptions<TView, TPayload>>;
		transactionStatus: (params: {
			transactionId: string;
			timeoutMs?: number;
		}) => ReturnType<typeof transactionStatusQueryOptions>;
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

		init: (client) => ({
			query: {
				contracts: <T = unknown>(params: ContractQueryOptionsParams<T>) =>
					contractQueryOptions<T>({ client, ...params }),
				pagedContracts: <T = unknown>(params: PagedContractsQueryOptionsParams<T>) =>
					pagedContractsQueryOptions<T>({ client, ...params }),
				contractById: <T = unknown>(params: {
					templateId: NexusTemplateIdentifier;
					contractId: string;
					parties?: string[];
					enabled?: boolean;
					staleTime?: number;
				}) => fetchByIdOptions<T>({ client, ...params }),
				contractByKey: <T = unknown>(params: {
					templateId: NexusTemplateIdentifier;
					key: Record<string, unknown>;
					parties?: string[];
					enabled?: boolean;
					staleTime?: number;
				}) => fetchByKeyOptions<T>({ client, ...params }),
				interfaces: <TView = unknown, TPayload = unknown>(
					params: InterfaceQueryOptionsParams<TView, TPayload>,
				) => interfaceQueryOptions<TView, TPayload>({ client, ...params }),
				transactionStatus: (params: { transactionId: string; timeoutMs?: number }) =>
					transactionStatusQueryOptions({ client, ...params }),
				ledgerEnd: () => ledgerEndQueryOptions({ client }),
				partyId: (params: PartyIdQueryOptionsParams) => partyIdQueryOptions({ client, ...params }),
				synchronizers: () => synchronizersQueryOptions({ client }),
			},
		}),

		getActions: (client): TanstackQueryActions => ({
			// ─── Contract Queries ────────────────────────────────────────────────

			/** @deprecated Use `useQuery(nexus.query.contracts(...))` or `useSuspenseQuery(nexus.query.contracts(...))` instead. */
			useContracts: <T = unknown>(opts: UseContractsOptions<T>): UseContractsResult<T> => {
				const result = useQuery(contractQueryOptions<T>({ client, ...opts }));
				return { ...result, contracts: result.data?.contracts ?? [] } as UseContractsResult<T>;
			},

			/** @deprecated Use `useSuspenseQuery(nexus.query.contracts(...))` instead. */
			useContractsSuspense: <T = unknown>(
				opts: UseContractsOptions<T>,
			): UseContractsSuspenseResult<T> => {
				const result = useSuspenseQuery(contractQueryOptions<T>({ client, ...opts }));
				return {
					...result,
					contracts: result.data?.contracts ?? [],
				} as UseContractsSuspenseResult<T>;
			},

			/** @deprecated Use `useQuery(nexus.query.contractById(...))` instead. */
			useFetch: <T = unknown>(opts: UseFetchOptions<T>) =>
				useQuery(fetchByIdOptions<T>({ client, ...opts })),

			/** @deprecated Use `useQuery(nexus.query.contractByKey(...))` instead. */
			useFetchByKey: <T = unknown>(opts: UseFetchByKeyOptions<T>) =>
				useQuery(fetchByKeyOptions<T>({ client, ...opts })),

			/** @deprecated Use `useInfiniteQuery(nexus.query.pagedContracts(...))` instead. */
			usePagedContracts: <T = unknown>(
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
							filter: opts.filter as Record<string, unknown>,
							pageSize: opts.pageSize ?? DEFAULT_PAGE_SIZE,
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

			/** @deprecated Use `useQuery(nexus.query.interfaces(...))` instead. */
			useInterface: <TView = unknown, TPayload = unknown>(
				opts: UseInterfaceOptions<TView, TPayload>,
			) => useQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts })),

			/** @deprecated Use `useSuspenseQuery(nexus.query.interfaces(...))` instead. */
			useInterfaceSuspense: <TView = unknown, TPayload = unknown>(
				opts: UseInterfaceOptions<TView, TPayload>,
			) => useSuspenseQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts })),

			// ─── Ledger State ────────────────────────────────────────────────────

			/** @deprecated Use `useQuery(nexus.query.partyId(...))` instead. */
			usePartyId: (userId: string) => useQuery(partyIdQueryOptions({ client, userId })),

			/** @deprecated Use `useQuery(nexus.query.ledgerEnd())` instead. */
			useLedgerEnd: () => useQuery(ledgerEndQueryOptions({ client })),

			/** @deprecated Use `useQuery(nexus.query.synchronizers())` instead. */
			useSynchronizers: () => useQuery(synchronizersQueryOptions({ client })),

			/** @deprecated Use `useQuery(nexus.query.transactionStatus(...))` instead. */
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
				const closeRef = useRef<(() => void) | null>(null);

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
				}, [commandId, options?.submissionId, options?.fromOffset, options?.parties]);

				return { state, connected, close: () => closeRef.current?.() };
			},

			// ─── Scoped Hooks ───────────────────────────────────────────────────

			useRightsAs: (party: string): UseRightsAsResult => ({
				readAsParty: party,
				useContracts: <T = unknown>(
					opts: Omit<UseContractsOptions<T>, "parties">,
				): UseContractsResult<T> => {
					const result = useQuery(contractQueryOptions<T>({ client, ...opts, parties: [party] }));
					return { ...result, contracts: result.data?.contracts ?? [] } as UseContractsResult<T>;
				},
				useContractsSuspense: <T = unknown>(
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
				usePagedContracts: <T = unknown>(
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
				useFetch: <T = unknown>(opts: Omit<UseFetchOptions<T>, "parties">) =>
					useQuery(fetchByIdOptions<T>({ client, ...opts, parties: [party] })),
				useFetchByKey: <T = unknown>(opts: Omit<UseFetchByKeyOptions<T>, "parties">) =>
					useQuery(fetchByKeyOptions<T>({ client, ...opts, parties: [party] })),
				useInterface: <TView = unknown, TPayload = unknown>(
					opts: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
				) =>
					useQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts, parties: [party] })),
				useInterfaceSuspense: <TView = unknown, TPayload = unknown>(
					opts: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
				) =>
					useSuspenseQuery(
						interfaceQueryOptions<TView, TPayload>({ client, ...opts, parties: [party] }),
					),
			}),

			// ─── Mutations ──────────────────────────────────────────────────────

			useCreateContract: <T = unknown>(opts: UseCreateContractOptions<T> = {}) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: async (vars: CreateContractVariables<T>) => {
						const result = await client.ledger.commands.createContract<T>(
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
										templateId: vars.templateId as unknown as TemplateId,
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
						const templateId = toStableTemplateId(vars.templateId);
						const templates =
							opts.invalidateTemplates ?? ([templateId] as NexusTemplateIdentifier[]);
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
						return client.ledger.commands.exerciseChoice<unknown>(
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

							if (typeof opts.optimistic === "function") {
								const update = opts.optimistic(vars);
								return {
									...prev,
									contracts: prev.contracts.map((c) =>
										c.contractId === vars.contractId ? { ...c, ...update, isOptimistic: true } : c,
									),
								};
							}

							const choiceName =
								typeof vars.choice === "string" ? vars.choice : vars.choice.choiceName;
							if (choiceName.toLowerCase().includes("archive")) {
								return {
									...prev,
									contracts: prev.contracts.filter((c) => c.contractId !== vars.contractId),
								};
							}

							const clientWithOptimistic = client as NexusClient & {
								optimistic?: TanstackQueryActions["optimistic"];
							};
							if (clientWithOptimistic.optimistic) {
								const pluginUpdate = clientWithOptimistic.optimistic.getUpdate(
									stableTemplateId,
									choiceName,
									vars.choiceArgument,
									contract as ActiveContract<unknown>,
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
						const templateId = toStableTemplateId(vars.templateId);
						const templates =
							opts.invalidateTemplates ?? ([templateId] as NexusTemplateIdentifier[]);
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

			useExerciseAndGetResult: <TArg = unknown, TResult = unknown>(
				opts: UseExerciseAndGetResultOptions<TResult> = {},
			) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: async (vars: ExerciseAndGetResultVariables<TArg, TResult>) => {
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

			query: {
				contracts: <T = unknown>(params: ContractQueryOptionsParams<T>) =>
					contractQueryOptions<T>({ client, ...params }),
				pagedContracts: <T = unknown>(params: PagedContractsQueryOptionsParams<T>) =>
					pagedContractsQueryOptions<T>({ client, ...params }),
				contractById: <T = unknown>(params: {
					templateId: NexusTemplateIdentifier;
					contractId: string;
					parties?: string[];
					enabled?: boolean;
					staleTime?: number;
				}) => fetchByIdOptions<T>({ client, ...params }),
				contractByKey: <T = unknown>(params: {
					templateId: NexusTemplateIdentifier;
					key: Record<string, unknown>;
					parties?: string[];
					enabled?: boolean;
					staleTime?: number;
				}) => fetchByKeyOptions<T>({ client, ...params }),
				interfaces: <TView = unknown, TPayload = unknown>(
					params: InterfaceQueryOptionsParams<TView, TPayload>,
				) => interfaceQueryOptions<TView, TPayload>({ client, ...params }),
				transactionStatus: (params: { transactionId: string; timeoutMs?: number }) =>
					transactionStatusQueryOptions({ client, ...params }),
				ledgerEnd: () => ledgerEndQueryOptions({ client }),
				partyId: (params: PartyIdQueryOptionsParams) => partyIdQueryOptions({ client, ...params }),
				synchronizers: () => synchronizersQueryOptions({ client }),
			},
		}),
	};
}
