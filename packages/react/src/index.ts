// ─── Context & Provider ───────────────────────────────────────────────────────

// ─── Re-export core types used in hooks ──────────────────────────────────────
export type {
	ActiveContract,
	ActiveContractsResponse,
	LedgerEnd,
	NexusClient,
	NexusConfig,
	NexusSession,
	SubmitResult,
	SynchronizerInfo,
	TemplateId,
} from "@nexus-framework/core";
export { NexusAuthError, NexusError, NexusLedgerError } from "@nexus-framework/core";
export type { NexusProviderProps } from "./context/nexus-provider.tsx";
export { NexusProvider, useNexusClient } from "./context/nexus-provider.tsx";
export type { UseContractsOptions } from "./hooks/use-contracts.ts";
// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useContracts, useContractsSuspense } from "./hooks/use-contracts.ts";
export { useLedgerEnd, useSynchronizers } from "./hooks/use-ledger-end.ts";
export { usePartyId } from "./hooks/use-party-id.ts";
export type {
	CreateContractVariables,
	ExerciseChoiceVariables,
	UseCreateContractOptions,
	UseExerciseChoiceOptions,
	UseLedgerMutationOptions,
} from "./hooks/use-submit.ts";
export {
	useCreateContract,
	useExerciseChoice,
	useLedgerMutation,
} from "./hooks/use-submit.ts";
export type { ContractQueryFilters, NexusQueryKey } from "./query/query-keys.ts";
// ─── Query Keys ───────────────────────────────────────────────────────────────
export {
	invalidateAllNexusQueries,
	invalidateContractQueries,
	nexusKeys,
} from "./query/query-keys.ts";
export type { ContractQueryOptionsInput } from "./query/query-options.ts";
// ─── Query Options (TanStack) ─────────────────────────────────────────────────
export {
	contractQueryOptions,
	ledgerEndQueryOptions,
	partyIdQueryOptions,
	prefetchContracts,
	synchronizersQueryOptions,
} from "./query/query-options.ts";
