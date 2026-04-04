"use client";

import {
	type ActiveContract,
	createNexus,
	type DamlTemplate,
	type NexusClient,
	type NexusPlugin,
	type SubmitResult,
} from "@nexus-framework/core";
import type { UseQueryResult } from "@tanstack/react-query";
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

export type InferNexusPlugins<P extends AnyPlugin[]> = UnionToIntersection<
	| ExtractCorePluginContext<P[number]>
	| ExtractReactPluginContext<P[number]>
	| ExtractGetActionsContext<P[number]>
>;

export type AnyPlugin = NexusPlugin | NexusClientPlugin;

// ─── Typed namespace ──────────────────────────────────────────────────────────

/** Extracts the payload type T from a DamlTemplate<T, ...> */
type ExtractTemplatePayload<T> = T extends DamlTemplate<infer P, infer _K, infer _I> ? P : unknown;

// Internal helper types to infer mutation result shapes
type UseCreateContractFn<T> = (opts?: UseCreateContractOptions<T>) => {
	mutate: (vars: CreateContractVariables<T>, options?: unknown) => void;
	mutateAsync: (vars: CreateContractVariables<T>, options?: unknown) => Promise<SubmitResult>;
	[key: string]: unknown;
};

type UseExerciseChoiceFn<TArg> = (opts?: UseExerciseChoiceOptions) => {
	mutate: (vars: ExerciseChoiceVariables<TArg>, options?: unknown) => void;
	mutateAsync: (vars: ExerciseChoiceVariables<TArg>, options?: unknown) => Promise<SubmitResult>;
	[key: string]: unknown;
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
	useContracts: (opts?: Omit<UseContractsOptions<T>, "templateId">) => UseContractsResult<T>;

	useContractsSuspense: (
		opts?: Omit<UseContractsOptions<T>, "templateId">,
	) => UseContractsSuspenseResult<T>;

	usePagedContracts: (
		opts?: Omit<UsePagedContractsOptions<T>, "templateId">,
	) => UsePagedContractsResult<T>;

	useFetch: (
		opts: Omit<UseFetchOptions<T>, "templateId">,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	useFetchByKey: <K = unknown>(
		opts: Omit<UseFetchByKeyOptions<T, K>, "templateId">,
	) => UseQueryResult<ActiveContract<T> | undefined>;

	useCreateContract: (opts?: UseCreateContractOptions<T>) => Omit<
		ReturnType<UseCreateContractFn<T>>,
		"mutate" | "mutateAsync"
	> & {
		mutate: (vars: Omit<CreateContractVariables<T>, "templateId">, options?: unknown) => void;
		mutateAsync: (
			vars: Omit<CreateContractVariables<T>, "templateId">,
			options?: unknown,
		) => Promise<SubmitResult>;
	};

	useExerciseChoice: <TArg = unknown>(
		opts?: UseExerciseChoiceOptions,
	) => Omit<ReturnType<UseExerciseChoiceFn<TArg>>, "mutate" | "mutateAsync"> & {
		mutate: (vars: Omit<ExerciseChoiceVariables<TArg>, "templateId">, options?: unknown) => void;
		mutateAsync: (
			vars: Omit<ExerciseChoiceVariables<TArg>, "templateId">,
			options?: unknown,
		) => Promise<SubmitResult>;
	};
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
	// Use a concrete named-property type so noUncheckedIndexedAccess doesn't widen to `| undefined`
	type HookMap = {
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
			const result = n.useCreateContract(opts) as ReturnType<UseCreateContractFn<T>>;
			return {
				...result,
				mutate: (vars, options) => result.mutate({ ...vars, templateId: template }, options),
				mutateAsync: (vars, options) =>
					result.mutateAsync({ ...vars, templateId: template }, options),
			};
		},

		useExerciseChoice: (opts = {}) => {
			const result = n.useExerciseChoice(opts) as ReturnType<UseExerciseChoiceFn<unknown>>;
			return {
				...result,
				mutate: (vars, options) =>
					result.mutate(
						{ ...vars, templateId: template } as ExerciseChoiceVariables<unknown>,
						options,
					),
				mutateAsync: (vars, options) =>
					result.mutateAsync(
						{ ...vars, templateId: template } as ExerciseChoiceVariables<unknown>,
						options,
					),
			};
		},
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
}): Promise<NexusClientInstance<InferNexusPlugins<TPlugins>, TTypes>> {
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

	const mergedActions = Object.assign({}, ...allActions) as InferNexusPlugins<TPlugins> &
		Record<string, unknown>;

	// Second pass: re-run getActions with full merged context so plugins can cross-reference
	const actions = Object.assign(
		{},
		...clientPlugins.map((p) => {
			if (!p.getActions) return {};
			return p.getActions({ ...coreClient, ...mergedActions } as NexusClient);
		}),
	) as InferNexusPlugins<TPlugins> & Record<string, unknown>;

	const client = { ...coreClient, ...actions } as NexusClientInstance<
		InferNexusPlugins<TPlugins>,
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
