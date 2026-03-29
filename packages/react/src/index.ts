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
	NexusProviderComponentProps,
} from "./create-nexus-client.ts";
export { createNexusClient } from "./create-nexus-client.ts";
export {
	type IdentityActions,
	identityPlugin,
} from "./plugins/identity.ts";
export {
	type OptimisticUiPluginOptions,
	type OptimisticUpdateConfig,
	optimisticUiPlugin,
} from "./plugins/optimistic-ui-plugin.ts";
// ─── Plugins ──────────────────────────────────────────────────────────────────
export type {
	MultiStreamContractsState,
	MultiStreamMapping,
	StreamContractsState,
	StreamingActions,
	UseMultiStreamOptions,
	UseStreamContractsOptions,
} from "./plugins/streaming.ts";
export { streamingPlugin } from "./plugins/streaming.ts";
export type {
	CreateContractVariables,
	ExerciseAndGetResultVariables,
	ExerciseChoiceVariables,
	NexusClientPlugin,
	TanstackQueryActions,
	UseContractsOptions,
	UseCreateContractOptions,
	UseExerciseAndGetResultOptions,
	UseExerciseChoiceOptions,
	UseInterfaceOptions,
	UseLedgerMutationOptions,
	UseRightsAsResult,
} from "./plugins/tanstack-query.ts";
export { tanstackQueryPlugin } from "./plugins/tanstack-query.ts";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export type { ContractQueryFilters, NexusQueryKey } from "./query/query-keys.ts";
export {
	invalidateAllNexusQueries,
	invalidateContractQueries,
	nexusKeys,
} from "./query/query-keys.ts";
