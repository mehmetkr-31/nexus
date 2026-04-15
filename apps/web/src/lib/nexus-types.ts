import { MultisigWallet } from "@daml.js/nexus-example-0.0.1";

/**
 * Centralized Daml template types for Nexus.
 *
 * This is the single source of truth for all Daml templates used in the app.
 * Use `as const` to preserve exact type structure for TypeScript inference.
 *
 * Benefits:
 * - No type duplication between nexus server and routers
 * - Full type inference in oRPC procedures
 * - Easy to add/remove templates in one place
 */
export const nexusTypes = {
	MultisigWallet: MultisigWallet.MultisigWallet,
	TransactionProposal: MultisigWallet.TransactionProposal,
	GovernanceProposal: MultisigWallet.GovernanceProposal,
	PendingWalletUpdate: MultisigWallet.PendingWalletUpdate,
} as const;

/**
 * Extract the type from the nexusTypes const.
 * Use this type when you need to reference the Daml template types.
 */
export type NexusTypes = typeof nexusTypes;
