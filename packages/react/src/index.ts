// ─── Re-export core types and factories ──────────────────────────────────────
export type {
	ActiveContract,
	ActiveContractsResponse,
	ActiveInterface,
	ActiveInterfacesResponse,
	ExerciseResult,
	JwtAuthOptions,
	LedgerEnd,
	NexusClient,
	NexusConfig,
	NexusPlugin,
	NexusSession,
	OidcAuthOptions,
	SandboxAuthOptions,
	SubmitResult,
	SynchronizerInfo,
	TemplateId,
	TransactionResult,
} from "@nexus-framework/core";
// Auth plugins (re-exported from core for convenience)
export {
	jwtAuth,
	NexusAuthError,
	NexusError,
	NexusLedgerError,
	oidcAuth,
	sandboxAuth,
} from "@nexus-framework/core";
// ─── Context & Provider ───────────────────────────────────────────────────────
export type { NexusProviderProps } from "./context/nexus-provider.tsx";
export { NexusProvider, useNexusClient } from "./context/nexus-provider.tsx";
export type {
	AnyPlugin,
	NexusClientInstance,
	NexusProviderComponentProps,
} from "./create-nexus-client.ts";
// ─── createNexusClient (React client factory) ────────────────────────────────
export { createNexusClient } from "./create-nexus-client.ts";
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
export type {
	StreamContractsState,
	StreamingActions,
	UseStreamContractsOptions,
} from "./plugins/streaming.ts";
export { streamingPlugin } from "./plugins/streaming.ts";
export type {
	ExerciseAndGetResultVariables,
	NexusClientPlugin,
	TanstackQueryActions,
	UseExerciseAndGetResultOptions,
	UseInterfaceOptions,
} from "./plugins/tanstack-query.ts";
// ─── Plugins ──────────────────────────────────────────────────────────────────
export { tanstackQueryPlugin } from "./plugins/tanstack-query.ts";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export type { ContractQueryFilters, NexusQueryKey } from "./query/query-keys.ts";
export {
	invalidateAllNexusQueries,
	invalidateContractQueries,
	nexusKeys,
} from "./query/query-keys.ts";

// ─── Query Options (TanStack) ─────────────────────────────────────────────────
export type {
	ContractQueryOptionsInput,
	InterfaceQueryOptionsInput,
} from "./query/query-options.ts";
export {
	contractQueryOptions,
	interfaceQueryOptions,
	ledgerEndQueryOptions,
	partyIdQueryOptions,
	prefetchContracts,
	synchronizersQueryOptions,
} from "./query/query-options.ts";
