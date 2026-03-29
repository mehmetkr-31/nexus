import type {
	ActiveContractsResponse,
	ActiveInterfacesResponse,
	ExerciseResult,
	LedgerEnd,
	NexusClient,
	SubmitResult,
	SynchronizerInfo,
	TemplateDescriptor,
	TemplateId,
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
import { invalidateContractQueries, nexusKeys } from "../query/query-keys.ts";
import {
	contractQueryOptions,
	interfaceQueryOptions,
	ledgerEndQueryOptions,
	partyIdQueryOptions,
	synchronizersQueryOptions,
} from "../query/query-options.ts";

function isTemplateId(t: unknown): t is TemplateId {
	return !!t && typeof t === "object" && "packageId" in t;
}

export interface UseContractsOptions<_T = Record<string, unknown>> {
	templateId: string | TemplateDescriptor;
	parties?: string[];
	filter?: Record<string, unknown>;
	fetchAll?: boolean;
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

export interface UseCreateContractOptions {
	invalidateTemplates?: Array<string | TemplateDescriptor>;
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
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
}

export interface UseLedgerMutationOptions<TVariables = void> {
	mutationFn: (client: NexusClient, variables: TVariables) => Promise<SubmitResult>;
	invalidateTemplates?: Array<string | TemplateDescriptor>;
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
	/** If true, wait for the transaction to be committed to the ledger before resolving. */
	waitForFinality?: boolean;
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
	onTokenRefreshed?: (newToken: string) => void | Promise<void>;
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
	) => UseQueryResult<ActiveContractsResponse<T>>;
	/** Scoped Suspense contract query. */
	useContractsSuspense: <T = Record<string, unknown>>(
		options: Omit<UseContractsOptions<T>, "parties">,
	) => UseSuspenseQueryResult<ActiveContractsResponse<T>>;
	/** Scoped interface query. */
	useInterface: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
		options: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
	) => UseQueryResult<ActiveInterfacesResponse<TView, TPayload>>;
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

	/**
	 * Check the status of a transaction on the ledger.
	 *
	 * @param transactionId Hex ID of the transaction to check
	 */
	useTransactionStatus: (transactionId: string | undefined) => UseQueryResult<boolean>;

	/**
	 * Returns a scoped set of query hooks pre-bound to the given party as `readAs`.
	 * Equivalent to @c7-digital/react's `useRightsAs()` — useful for multi-party UIs
	 * where you want to switch perspective without threading `parties` everywhere.
	 *
	 * @example
	 * ```tsx
	 * const alice = nexus.useRightsAs("Alice::...");
	 * const { data } = alice.useContracts({ templateId: "pkg:Iou:Iou" });
	 * // → Queries with readAs=["Alice::..."]
	 * ```
	 */
	useRightsAs: (party: string) => UseRightsAsResult;
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

			useSynchronizers: () => {
				return useQuery(synchronizersQueryOptions(client));
			},

			useTransactionStatus: (transactionId: string | undefined) => {
				return useQuery({
					queryKey: nexusKeys.transactionStatus(transactionId ?? ""),
					queryFn: async () => {
						if (!transactionId) return false;
						try {
							await client.http.waitForTransaction(transactionId, { timeoutMs: 2000 });
							return true;
						} catch {
							return false;
						}
					},
					enabled: !!transactionId,
					refetchInterval: (query) => (query.state.data === true ? false : 1000),
				});
			},

			// ─── Mutations ──────────────────────────────────────────────────────

			useCreateContract: (opts: UseCreateContractOptions = {}) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: async (vars: CreateContractVariables) => {
						let finalTemplateId = vars.templateId;
						if (
							typeof finalTemplateId !== "string" &&
							!("packageId" in finalTemplateId) &&
							client.packages
						) {
							const resolver = client.packages as import("@nexus-framework/core").PackageResolver;
							finalTemplateId = await resolver.resolveTemplateId(finalTemplateId);
						}
						return client.ledger.commands.createContract(
							finalTemplateId as string | TemplateId,
							vars.createArguments,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						);
					},
					onSuccess: async (result, vars) => {
						if (opts.waitForFinality) {
							await client.http.waitForTransaction(result.transactionId);
						}

						const templateId =
							typeof vars.templateId === "string"
								? vars.templateId
								: isTemplateId(vars.templateId)
									? `${vars.templateId.packageId}:${vars.templateId.moduleName}:${vars.templateId.entityName}`
									: `${(vars.templateId as TemplateDescriptor).packageName}:${vars.templateId.moduleName}:${vars.templateId.entityName}`;

						const templates =
							opts.invalidateTemplates ?? ([templateId] as Array<string | TemplateDescriptor>);
						const stableTemplates = templates.map((t) =>
							typeof t === "string"
								? t
								: isTemplateId(t)
									? `${t.packageId}:${t.moduleName}:${t.entityName}`
									: `${(t as TemplateDescriptor).packageName}:${t.moduleName}:${t.entityName}`,
						);
						await invalidateContractQueries(queryClient, stableTemplates);
						await opts.onSuccess?.(result);
					},
					onError: opts.onError,
				});
			},

			useExerciseChoice: (opts: UseExerciseChoiceOptions = {}) => {
				const queryClient = useQueryClient();
				return useMutation({
					mutationFn: async (vars: ExerciseChoiceVariables) => {
						let finalTemplateId = vars.templateId;
						if (
							typeof finalTemplateId !== "string" &&
							!("packageId" in finalTemplateId) &&
							client.packages
						) {
							const resolver = client.packages as import("@nexus-framework/core").PackageResolver;
							finalTemplateId = await resolver.resolveTemplateId(finalTemplateId);
						}
						return client.ledger.commands.exerciseChoice(
							finalTemplateId as string | TemplateId,
							vars.contractId,
							vars.choice,
							vars.choiceArgument,
							vars.actAs,
							{ readAs: vars.readAs, workflowId: vars.workflowId },
						);
					},
					onSuccess: async (result, vars) => {
						if (opts.waitForFinality) {
							await client.http.waitForTransaction(result.transactionId);
						}

						const templateId =
							typeof vars.templateId === "string"
								? vars.templateId
								: isTemplateId(vars.templateId)
									? `${vars.templateId.packageId}:${vars.templateId.moduleName}:${vars.templateId.entityName}`
									: `${(vars.templateId as TemplateDescriptor).packageName}:${vars.templateId.moduleName}:${vars.templateId.entityName}`;

						const templates =
							opts.invalidateTemplates ?? ([templateId] as Array<string | TemplateDescriptor>);
						const stableTemplates = templates.map((t) =>
							typeof t === "string"
								? t
								: isTemplateId(t)
									? `${t.packageId}:${t.moduleName}:${t.entityName}`
									: `${(t as TemplateDescriptor).packageName}:${t.moduleName}:${t.entityName}`,
						);
						await invalidateContractQueries(queryClient, stableTemplates);
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
					mutationFn: async (vars: ExerciseAndGetResultVariables<TArg>) => {
						let finalTemplateId = vars.templateId;
						if (typeof finalTemplateId !== "string" && client.packages) {
							const resolver = client.packages as import("@nexus-framework/core").PackageResolver;
							finalTemplateId = await resolver.resolveTemplateId(finalTemplateId);
						}
						return client.ledger.commands.exerciseAndGetResult<TArg, TResult>(
							finalTemplateId as string | TemplateId,
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

						const stableTemplates = templates.map((t) =>
							typeof t === "string"
								? t
								: isTemplateId(t)
									? `${t.packageId}:${t.moduleName}:${t.entityName}`
									: `${(t as TemplateDescriptor).packageName}:${t.moduleName}:${t.entityName}`,
						);
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
							await client.http.waitForTransaction(result.transactionId);
						}

						if (opts.invalidateTemplates && opts.invalidateTemplates.length > 0) {
							const stableTemplates = opts.invalidateTemplates.map((t) =>
								typeof t === "string"
									? t
									: isTemplateId(t)
										? `${t.packageId}:${t.moduleName}:${t.entityName}`
										: `${(t as TemplateDescriptor).packageName}:${t.moduleName}:${t.entityName}`,
							);
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
				) => useQuery(contractQueryOptions<T>({ client, ...opts, parties: [party] })),
				useContractsSuspense: <T = Record<string, unknown>>(
					opts: Omit<UseContractsOptions<T>, "parties">,
				) => useSuspenseQuery(contractQueryOptions<T>({ client, ...opts, parties: [party] })),
				useInterface: <TView = Record<string, unknown>, TPayload = Record<string, unknown>>(
					opts: Omit<UseInterfaceOptions<TView, TPayload>, "parties">,
				) =>
					useQuery(interfaceQueryOptions<TView, TPayload>({ client, ...opts, parties: [party] })),
			}),
		}),
	};
}
