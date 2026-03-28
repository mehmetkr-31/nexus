// ─── Re-export core types and factories ──────────────────────────────────────
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

// Auth plugins (re-exported from core for convenience)
export { sandboxAuth } from "@nexus-framework/core";
export type { SandboxAuthOptions } from "@nexus-framework/core";
export { jwtAuth } from "@nexus-framework/core";
export type { JwtAuthOptions } from "@nexus-framework/core";
export { oidcAuth } from "@nexus-framework/core";
export type { OidcAuthOptions } from "@nexus-framework/core";
export type { NexusPlugin } from "@nexus-framework/core";

// ─── createNexusClient (React client factory) ────────────────────────────────
export { createNexusClient } from "./create-nexus-client.ts";
export type {
	AnyPlugin,
	NexusClientInstance,
	NexusProviderComponentProps,
} from "./create-nexus-client.ts";

// ─── Context & Provider ───────────────────────────────────────────────────────
export type { NexusProviderProps } from "./context/nexus-provider.tsx";
export { NexusProvider, useNexusClient } from "./context/nexus-provider.tsx";

// ─── Plugins ──────────────────────────────────────────────────────────────────
export { tanstackQueryPlugin } from "./plugins/tanstack-query.ts";
export type { NexusClientPlugin, TanstackQueryActions } from "./plugins/tanstack-query.ts";

// ─── Hooks ────────────────────────────────────────────────────────────────────
export type { UseContractsOptions } from "./hooks/use-contracts.ts";
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

// ─── Query Keys ───────────────────────────────────────────────────────────────
export type { ContractQueryFilters, NexusQueryKey } from "./query/query-keys.ts";
export {
	invalidateAllNexusQueries,
	invalidateContractQueries,
	nexusKeys,
} from "./query/query-keys.ts";

// ─── Query Options (TanStack) ─────────────────────────────────────────────────
export type { ContractQueryOptionsInput } from "./query/query-options.ts";
export {
	contractQueryOptions,
	ledgerEndQueryOptions,
	partyIdQueryOptions,
	prefetchContracts,
	synchronizersQueryOptions,
} from "./query/query-options.ts";
