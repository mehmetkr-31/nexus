import { z } from "zod";

// ─── Signet Wallet Schemas ────────────────────────────────────────────────────
// Shared Zod schemas for Signet multisig wallet operations.
// These schemas are used by app-specific routers for input validation.

export const CreateWalletSchema = z.object({
	walletId: z.string().min(1),
	members: z.array(
		z.object({
			party: z.string(),
			role: z.enum(["Owner", "Admin", "Signer", "Viewer"]),
		}),
	),
	threshold: z.coerce.string(), // Daml Int → JS string
	custodian: z.string(),
});

export const ProposeTransferSchema = z.object({
	walletCid: z.string().min(1),
	proposer: z.string().min(1),
	recipient: z.string().min(1),
	txAmount: z.coerce.number().positive(), // String input → number (Daml Decimal)
	txCurrency: z.string().min(1),
	description: z.string(),
});

export const ApproveProposalSchema = z.object({
	proposalCid: z.string().min(1),
	approver: z.string().min(1),
});

export const ExecuteTransactionSchema = z.object({
	proposalCid: z.string().min(1),
	executor: z.string().min(1),
	walletCid: z.string().min(1),
	iouCid: z.string().min(1),
});

export const RejectProposalSchema = z.object({
	proposalCid: z.string().min(1),
	rejector: z.string().min(1),
});

export const WalletQuerySchema = z.object({
	limit: z.number().int().min(1).max(1000).optional().default(50),
});

export const ProposalQuerySchema = z.object({
	limit: z.number().int().min(1).max(1000).optional().default(50),
	walletId: z.string().optional(),
});

// ─── Governance Proposal Schemas ──────────────────────────────────────────────

export const ProposeAddMemberSchema = z.object({
	walletCid: z.string().min(1),
	proposer: z.string().min(1),
	newMemberParty: z.string().min(1),
	newMemberRole: z.enum(["Owner", "Admin", "Signer", "Viewer"]),
});

export const ProposeRemoveMemberSchema = z.object({
	walletCid: z.string().min(1),
	proposer: z.string().min(1),
	memberToRemove: z.string().min(1),
});

export const ProposeChangeThresholdSchema = z.object({
	walletCid: z.string().min(1),
	proposer: z.string().min(1),
	newThreshold: z.coerce.string(), // Daml Int → JS string
});

export const ApproveGovernanceSchema = z.object({
	proposalCid: z.string().min(1),
	approver: z.string().min(1),
});

export const ExecuteGovernanceSchema = z.object({
	proposalCid: z.string().min(1),
	executor: z.string().min(1),
	walletCid: z.string().min(1),
});

export const RejectGovernanceSchema = z.object({
	proposalCid: z.string().min(1),
	rejector: z.string().min(1),
});

// ─── PendingWalletUpdate Schemas ──────────────────────────────────────────────

export const AcceptMembershipSchema = z.object({
	pendingUpdateCid: z.string().min(1),
});
