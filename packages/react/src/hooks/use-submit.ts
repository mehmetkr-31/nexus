import type { SubmitResult, TemplateId } from "@nexus-framework/core";
import { NexusLedgerError } from "@nexus-framework/core";
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNexusClient } from "../context/nexus-provider.tsx";
import { invalidateContractQueries } from "../query/query-keys.ts";

// ─── useCreateContract ────────────────────────────────────────────────────────

export interface CreateContractVariables<T = Record<string, unknown>> {
	templateId: string | TemplateId;
	createArguments: T;
	actAs: string[];
	readAs?: string[];
	workflowId?: string;
}

export interface UseCreateContractOptions {
	/**
	 * Template IDs whose contract queries should be invalidated after a
	 * successful create. If omitted, only the created template is invalidated.
	 */
	invalidateTemplates?: string[];
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating a new Daml contract.
 * Automatically invalidates related TanStack Query caches on success.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateContract({ invalidateTemplates: ["pkg:Mod:Iou"] });
 *
 * mutate({
 *   templateId: "pkg:Mod:Iou",
 *   createArguments: { issuer: "Alice::abc", owner: "Bob::xyz", amount: 100 },
 *   actAs: ["Alice::abc"],
 * });
 * ```
 */
export function useCreateContract(
	options: UseCreateContractOptions = {},
): UseMutationResult<SubmitResult, Error, CreateContractVariables> {
	const client = useNexusClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (vars: CreateContractVariables) =>
			client.ledger.commands.createContract(vars.templateId, vars.createArguments, vars.actAs, {
				readAs: vars.readAs,
				workflowId: vars.workflowId,
			}),
		onSuccess: async (result, vars) => {
			const templateId =
				typeof vars.templateId === "string"
					? vars.templateId
					: `${vars.templateId.packageId}:${vars.templateId.moduleName}:${vars.templateId.entityName}`;

			const templatesToInvalidate = options.invalidateTemplates ?? [templateId];
			await invalidateContractQueries(queryClient, templatesToInvalidate);
			await options.onSuccess?.(result);
		},
		onError: options.onError,
	});
}

// ─── useExerciseChoice ────────────────────────────────────────────────────────

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
	/**
	 * Template IDs to invalidate after a successful exercise.
	 * Typically includes the exercised template and any consuming/created templates.
	 */
	invalidateTemplates?: string[];
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
}

/**
 * Mutation hook for exercising a choice on a Daml contract.
 * Automatically invalidates related query caches on success.
 *
 * @example
 * ```tsx
 * const { mutate } = useExerciseChoice({
 *   invalidateTemplates: ["pkg:Mod:Iou", "pkg:Mod:IouTransfer"],
 * });
 *
 * mutate({
 *   templateId: "pkg:Mod:Iou",
 *   contractId: "abc123",
 *   choice: "Transfer",
 *   choiceArgument: { newOwner: "Bob::xyz" },
 *   actAs: ["Alice::abc"],
 * });
 * ```
 */
export function useExerciseChoice(
	options: UseExerciseChoiceOptions = {},
): UseMutationResult<SubmitResult, Error, ExerciseChoiceVariables> {
	const client = useNexusClient();
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

			const templatesToInvalidate = options.invalidateTemplates ?? [templateId];
			await invalidateContractQueries(queryClient, templatesToInvalidate);
			await options.onSuccess?.(result);
		},
		onError: options.onError,
	});
}

// ─── useLedgerMutation ────────────────────────────────────────────────────────

/**
 * Generic ledger mutation hook for custom multi-command batches.
 * Provide your own mutationFn and invalidation logic.
 *
 * @example
 * ```tsx
 * const { mutate } = useLedgerMutation({
 *   mutationFn: async (nexus) => {
 *     return nexus.ledger.commands.submitBatch([...], ["Alice::abc"]);
 *   },
 *   invalidateTemplates: ["pkg:Mod:Iou"],
 * });
 * ```
 */
export interface UseLedgerMutationOptions<TVariables = void> {
	mutationFn: (
		client: ReturnType<typeof useNexusClient>,
		variables: TVariables,
	) => Promise<SubmitResult>;
	invalidateTemplates?: string[];
	onSuccess?: (result: SubmitResult) => void | Promise<void>;
	onError?: (error: Error) => void;
}

export function useLedgerMutation<TVariables = void>(
	options: UseLedgerMutationOptions<TVariables>,
): UseMutationResult<SubmitResult, Error, TVariables> {
	const client = useNexusClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (vars: TVariables) => options.mutationFn(client, vars),
		onSuccess: async (result) => {
			if (options.invalidateTemplates?.length) {
				await invalidateContractQueries(queryClient, options.invalidateTemplates);
			}
			await options.onSuccess?.(result);
		},
		onError: options.onError,
	});
}

// Re-export for convenience
export { NexusLedgerError };
