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
	TemplateDescriptor,
	TemplateId,
	TransactionResult,
} from "@nexus-framework/core";

// Auth plugins (re-exported from core for convenience)
export {
	fetchMiddlewarePlugin,
	jwtAuth,
	NexusAuthError,
	NexusError,
	NexusLedgerError,
	oidcAuth,
	packageDiscoveryPlugin,
	sandboxAuth,
} from "@nexus-framework/core";

// ─── createNexusClient (React client factory) ────────────────────────────────
export type {
	AnyPlugin,
	NexusClientInstance,
} from "./create-nexus-client";
export { createNexusClient } from "./create-nexus-client";
export {
	type IdentityActions,
	identityPlugin,
} from "./plugins/identity";
export {
	type OptimisticUiPluginOptions,
	type OptimisticUpdateConfig,
	optimisticUiPlugin,
} from "./plugins/optimistic-ui-plugin";
// ─── Plugins ──────────────────────────────────────────────────────────────────
export type {
	MultiStreamContractsState,
	MultiStreamMapping,
	StreamContractsState,
	StreamingActions,
	UseMultiStreamOptions,
	UseStreamContractsOptions,
} from "./plugins/streaming";
export { streamingPlugin } from "./plugins/streaming";
export type {
	CommandStatusState,
	CreateContractVariables,
	ExerciseAndGetResultVariables,
	ExerciseChoiceVariables,
	NexusClientPlugin,
	TanstackQueryActions,
	UseCommandStatusResult,
	UseContractsOptions,
	UseContractsResult,
	UseContractsSuspenseResult,
	UseCreateContractOptions,
	UseExerciseAndGetResultOptions,
	UseExerciseChoiceOptions,
	UseInterfaceOptions,
	UseLedgerMutationOptions,
	UsePagedContractsResult,
	UseRightsAsResult,
} from "./plugins/tanstack-query";
export { tanstackQueryPlugin } from "./plugins/tanstack-query";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export type { ContractQueryFilters, NexusQueryKey } from "./query/query-keys";
export {
	invalidateAllNexusQueries,
	invalidateContractQueries,
	nexusKeys,
} from "./query/query-keys";
