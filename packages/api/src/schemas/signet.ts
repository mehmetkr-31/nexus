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
	threshold: z.number().int().min(1),
	custodian: z.string(),
});

export const ProposeTransferSchema = z.object({
	walletCid: z.string().min(1),
	proposer: z.string().min(1),
	recipient: z.string().min(1),
	txAmount: z.string().min(1),
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
