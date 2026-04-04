"use client";

import {
	type ActiveContract,
	createNexus,
	type DamlChoice,
	type DamlTemplate,
	type NexusClient,
	type NexusPlugin,
	type SubmitResult,
} from "@nexus-framework/core";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type {
	CreateContractVariables,
	ExerciseChoiceVariables,
	NexusClientPlugin,
	UseContractsOptions,
	UseContractsResult,
	UseContractsSuspenseResult,
	UseCreateContractOptions,
	UseExerciseChoiceOptions,
	UseFetchByKeyOptions,
	UseFetchOptions,
	UsePagedContractsOptions,
	UsePagedContractsResult,
} from "./plugins/tanstack-query.ts";
import {
	type ContractQueryOptionsParams,
	contractQueryOptions,
	fetchByIdOptions,
	fetchByKeyOptions,
	type PagedContractsQueryOptionsParams,
	pagedContractsQueryOptions,
} from "./query/query-options.ts";

// ─── Plugin type helpers ───────────────────────────────────────────────────────

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

export type InferNexusClientPlugins<P extends AnyPlugin[]> = UnionToIntersection<
	| ExtractCorePluginContext<P[number]>
	| ExtractReactPluginContext<P[number]>
	| ExtractGetActionsContext<P[number]>
>;

export type AnyPlugin = NexusPlugin | NexusClientPlugin;

// ─── Typed namespace ──────────────────────────────────────────────────────────

/** Extracts the payload type T from a DamlTemplate<T, ...> */
type ExtractTemplatePayload<T> = T extends DamlTemplate<infer P, infer _K, infer _I> ? P : unknown;

/**
 * Minimal exercise variables without templateId or choice —
 * both are pre-filled by the typed namespace via `useExercise(choice)`.
 */
type ExerciseCoreVars<TArg> = {
	contractId: string;
	choiceArgument: TArg;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
};

/**
 * A set of hooks pre-bound to a specific Daml template.
 * No need to pass `templateId` — it's inferred from the template object given in `types`.
 *
 * @example
 * ```ts
 * const { contracts } = nexus.Iou.useContracts({ parties: [partyId] })
 * const { mutate }    = nexus.Iou.useCreateContract()
 * mutate({ createArguments: { ... }, actAs: [partyId] })  // no templateId!
 * ```
 */
export type TypedContractNamespace<T> = {
	/** Query options factories — use with `useQuery`, `useSuspenseQuery`, or `useInfiniteQuery`. */
	query: {
		contracts: (
			params?: Omit<ContractQueryOptionsParams<T>, "templateId">,
		) => ReturnType<typeof contractQueryOptions<T>>;
		pagedContracts: (
			params?: Omit<PagedContractsQueryOptionsParams<T>, "templateId">,
		) => ReturnType<typeof pagedContractsQueryOptions<T>>;
		contractById: (params: {
			contractId: string;
			parties?: string[];
			enabled?: boolean;
			staleTime?: number;
		}) => ReturnType<typeof fetchByIdOptions<T>>;
		contractByKey: <K = unknown>(params: {
			key: K;
			keyPredicate: (payload: T) => boolean;
			parties?: string[];
			enabled?: boolean;
			staleTime?: number;
		}) => ReturnType<typeof fetchByKeyOptions<T, K>>;
	};

	/** @deprecated Use `useQuery(nexus.<Template>.query.contracts(...))` instead. */
	useContracts: (opts?: Omit<UseContractsOptions<T>, "templateId">) => UseContractsResult<T>;

	/** @deprecated Use `useSuspenseQuery(nexus.<Template>.query.contracts(...))` instead. */
	useContractsSuspense: (
		opts?: Omit<UseContractsOptions<T>, "templateId">,
	) => UseContractsSuspenseResult<T>;

	/** @deprecated Use `useInfiniteQuery(nexus.<Template>.query.pagedContracts(...))` instead. */
	usePagedContracts: (
		opts?: Omit<UsePagedContractsOptions<T>, "templateId">,
	) => UsePagedContractsResult<T>;

	/** @deprecated Use `useQuery(nexus.<Template>.query.contractById(...))` instead. */
	useFetch: (
		opts: Omit<UseFetchOptions<T>, "templateId">,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	/** @deprecated Use `useQuery(nexus.<Template>.query.contractByKey(...))` instead. */
	useFetchByKey: <K = unknown>(
		opts: Omit<UseFetchByKeyOptions<T, K>, "templateId">,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	useCreateContract: (
		opts?: UseCreateContractOptions<T>,
	) => UseMutationResult<SubmitResult, Error, Omit<CreateContractVariables<T>, "templateId">>;

	useExerciseChoice: <TArg = unknown>(
		opts?: UseExerciseChoiceOptions,
	) => UseMutationResult<SubmitResult, Error, Omit<ExerciseChoiceVariables<TArg>, "templateId">>;

	/**
	 * Pre-bound exercise: pass a `DamlChoice` object (or a choice name string) to
	 * get a fully typed mutation. Both `templateId` **and** `choice` are automatically
	 * injected — no need to pass them in `mutate()`.
	 *
	 * `TArg` is inferred from the `DamlChoice` type, so TypeScript knows exactly
	 * what shape `choiceArgument` must be.
	 *
	 * @example
	 * ```ts
	 * // Fully typed — TArg = Transfer = { newOwner: string }
	 * const { mutate } = nexus.Iou.useExercise(Iou.Iou.Transfer)
	 * mutate({ contractId, choiceArgument: { newOwner: "alice" }, actAs })
	 *
	 * // String choice — TArg = unknown (still cleaner than useExerciseChoice)
	 * const { mutate } = nexus.Iou.useExercise("Archive")
	 * mutate({ contractId, choiceArgument: {}, actAs })
	 * ```
	 */
	useExercise: <TArg = unknown>(
		choice: string | DamlChoice<unknown, TArg, unknown, unknown>,
		opts?: UseExerciseChoiceOptions,
	) => UseMutationResult<SubmitResult, Error, ExerciseCoreVars<TArg>>;
};

/** Maps a record of DamlTemplates to their corresponding TypedContractNamespaces */
export type NexusTypedNamespaces<TTypes extends Record<string, DamlTemplate<unknown>>> = {
	[K in keyof TTypes]: TypedContractNamespace<ExtractTemplatePayload<TTypes[K]>>;
};

/**
 * Builds a typed namespace for a single Daml template.
 * All hooks have `templateId` pre-filled from the given template object.
 */
function buildTypedNamespace<T>(
	nexus: Record<string, unknown>,
	template: DamlTemplate<T>,
): TypedContractNamespace<T> {
	type HookMap = {
		query: {
			contracts: (...args: unknown[]) => unknown;
			pagedContracts: (...args: unknown[]) => unknown;
			contractById: (...args: unknown[]) => unknown;
			contractByKey: (...args: unknown[]) => unknown;
		};
		useContracts: (...args: unknown[]) => unknown;
		useContractsSuspense: (...args: unknown[]) => unknown;
		usePagedContracts: (...args: unknown[]) => unknown;
		useFetch: (...args: unknown[]) => unknown;
		useFetchByKey: (...args: unknown[]) => unknown;
		useCreateContract: (...args: unknown[]) => unknown;
		useExerciseChoice: (...args: unknown[]) => unknown;
	};
	const n = nexus as HookMap;

	return {
		query: {
			contracts: (params = {}) =>
				// biome-ignore lint/suspicious/noExplicitAny: delegate to runtime-typed query factory
				(n.query.contracts as any)({ ...params, templateId: template }),
			pagedContracts: (params = {}) =>
				// biome-ignore lint/suspicious/noExplicitAny: delegate to runtime-typed query factory
				(n.query.pagedContracts as any)({ ...params, templateId: template }),
			contractById: (params) =>
				// biome-ignore lint/suspicious/noExplicitAny: delegate to runtime-typed query factory
				(n.query.contractById as any)({ ...params, templateId: template }),
			contractByKey: (params) =>
				// biome-ignore lint/suspicious/noExplicitAny: delegate to runtime-typed query factory
				(n.query.contractByKey as any)({ ...params, templateId: template }),
		},

		useContracts: (opts = {}) =>
			n.useContracts({ ...opts, templateId: template }) as UseContractsResult<T>,

		useContractsSuspense: (opts = {}) =>
			n.useContractsSuspense({ ...opts, templateId: template }) as UseContractsSuspenseResult<T>,

		usePagedContracts: (opts = {}) =>
			n.usePagedContracts({ ...opts, templateId: template }) as UsePagedContractsResult<T>,

		useFetch: (opts) =>
			n.useFetch({ ...opts, templateId: template }) as UseQueryResult<
				ActiveContract<T> | undefined
			>,

		useFetchByKey: (opts) =>
			n.useFetchByKey({ ...opts, templateId: template }) as UseQueryResult<
				ActiveContract<T> | undefined
			>,

		useCreateContract: (opts = {}) => {
			type MutVars = Omit<CreateContractVariables<T>, "templateId">;
			const result = n.useCreateContract(opts) as UseMutationResult<
				SubmitResult,
				Error,
				CreateContractVariables<T>
			>;
			return {
				...result,
				mutate: (vars: MutVars, options) =>
					result.mutate({ ...vars, templateId: template }, options),
				mutateAsync: (vars: MutVars, options) =>
					result.mutateAsync({ ...vars, templateId: template }, options),
			} as UseMutationResult<SubmitResult, Error, MutVars>;
		},

		useExerciseChoice: ((opts = {}) => {
			const result = n.useExerciseChoice(opts) as UseMutationResult<
				SubmitResult,
				Error,
				ExerciseChoiceVariables<unknown>
			>;
			return {
				...result,
				mutate: (vars: Omit<ExerciseChoiceVariables<unknown>, "templateId">, options) =>
					result.mutate(
						{ ...vars, templateId: template } as ExerciseChoiceVariables<unknown>,
						// biome-ignore lint/suspicious/noExplicitAny: MutateOptions<TArg> → MutateOptions<unknown>
						options as any,
					),
				mutateAsync: (vars: Omit<ExerciseChoiceVariables<unknown>, "templateId">, options) =>
					result.mutateAsync(
						{ ...vars, templateId: template } as ExerciseChoiceVariables<unknown>,
						// biome-ignore lint/suspicious/noExplicitAny: MutateOptions<TArg> → MutateOptions<unknown>
						options as any,
					),
			};
		}) as TypedContractNamespace<T>["useExerciseChoice"],

		useExercise: ((choice, opts = {}) => {
			const result = n.useExerciseChoice(opts) as UseMutationResult<
				SubmitResult,
				Error,
				ExerciseChoiceVariables<unknown>
			>;
			return {
				...result,
				mutate: (vars: ExerciseCoreVars<unknown>, options) =>
					result.mutate(
						{ ...vars, templateId: template, choice } as ExerciseChoiceVariables<unknown>,
						// biome-ignore lint/suspicious/noExplicitAny: MutateOptions<TArg> → MutateOptions<unknown>
						options as any,
					),
				mutateAsync: (vars: ExerciseCoreVars<unknown>, options) =>
					result.mutateAsync(
						{ ...vars, templateId: template, choice } as ExerciseChoiceVariables<unknown>,
						// biome-ignore lint/suspicious/noExplicitAny: MutateOptions<TArg> → MutateOptions<unknown>
						options as any,
					),
			};
		}) as TypedContractNamespace<T>["useExercise"],
	};
}

// ─── NexusClientInstance ──────────────────────────────────────────────────────

/**
 * The object returned by `createNexusClient()`.
 * Combines the core `NexusClient` with hooks from client plugins
 * and optional typed namespaces from the `types` option.
 */
export type NexusClientInstance<
	TPluginContext = Record<string, never>,
	TTypes extends Record<string, DamlTemplate<unknown>> = Record<never, never>,
> = NexusClient & TPluginContext & NexusTypedNamespaces<TTypes>;

// ─── createNexusClient ────────────────────────────────────────────────────────

/**
 * Create a Nexus client with React hooks via the plugin-based API.
 *
 * Hooks produced by client plugins (e.g. `tanstackQueryPlugin()`) close
 * over the `NexusClient` instance directly — no React Context is injected.
 *
 * Pass `types` to get typed namespaces where `templateId` is inferred automatically:
 *
 * @example
 * ```ts
 * import { Iou } from "@daml.js/nexus-example-0.0.1/lib/Iou"
 *
 * export const nexus = await createNexusClient({
 *   baseUrl: "/api/ledger",
 *   types: { Iou: Iou.Iou },
 *   plugins: [sandboxAuth({ ... }), tanstackQueryPlugin()],
 * })
 *
 * // In a component — no templateId needed:
 * const { contracts } = nexus.Iou.useContracts({ parties: [partyId] })
 * const { mutate }    = nexus.Iou.useCreateContract()
 * mutate({ createArguments: { ... }, actAs: [partyId] })
 * ```
 */
export async function createNexusClient<
	TPlugins extends AnyPlugin[],
	TTypes extends Record<string, DamlTemplate<unknown>> = Record<never, never>,
>(options: {
	baseUrl: string;
	apiPathPrefix?: string;
	timeoutMs?: number;
	plugins: TPlugins;
	/** Map Daml templates to typed namespaces on the client instance. */
	types?: TTypes;
}): Promise<NexusClientInstance<InferNexusClientPlugins<TPlugins>, TTypes>> {
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

	const mergedActions = Object.assign({}, ...allActions) as InferNexusClientPlugins<TPlugins> &
		Record<string, unknown>;

	// Second pass: re-run getActions with full merged context so plugins can cross-reference
	const actions = Object.assign(
		{},
		...clientPlugins.map((p) => {
			if (!p.getActions) return {};
			return p.getActions({ ...coreClient, ...mergedActions } as NexusClient);
		}),
	) as InferNexusClientPlugins<TPlugins> & Record<string, unknown>;

	const client = { ...coreClient, ...actions } as NexusClientInstance<
		InferNexusClientPlugins<TPlugins>,
		TTypes
	>;

	// Attach typed namespaces for each registered template
	if (options.types) {
		for (const [key, template] of Object.entries(options.types)) {
			(client as Record<string, unknown>)[key] = buildTypedNamespace(
				client as Record<string, unknown>,
				template,
			);
		}
	}

	return client;
}
