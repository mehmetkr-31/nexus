import {
	ApproveProposalSchema,
	ExecuteTransactionSchema,
	ProposalQuerySchema,
	ProposeTransferSchema,
	RejectProposalSchema,
	WalletQuerySchema,
} from "@nexus/api/schemas/signet";
import { z } from "zod";
import { orpc } from "./orpc";

/**
 * Signet multisig wallet router.
 *
 * This router is app-specific and uses the typed oRPC instance from `orpc.ts`.
 * Full type inference is provided - no type repetition, no `any` usage!
 *
 * Benefits:
 * - `context.ledger.MultisigWallet` is fully typed
 * - All Daml template types are inferred from nexus-types.ts
 * - Shared schemas from @nexus-framework/api/schemas/signet
 */
export const signetRouter = orpc.router({
	// ─── MultisigWallet Queries ─────────────────────────────────────────────────

	listWallets: orpc.query.input(WalletQuerySchema).handler(({ input, context }) => {
		return context.ledger.MultisigWallet.findMany({
			limit: input.limit,
		});
	}),

	getWallet: orpc.query
		.input(z.object({ contractId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const contract = await context.ledger.MultisigWallet.findById(input.contractId);
			if (!contract) {
				throw new Error(`Wallet not found: ${input.contractId}`);
			}
			return contract;
		}),

	// ─── Proposal Queries ───────────────────────────────────────────────────────

	listTransactionProposals: orpc.query.input(ProposalQuerySchema).handler(({ input, context }) => {
		return context.ledger.TransactionProposal.findMany({
			limit: input.limit,
			...(input.walletId ? { where: { walletId: input.walletId } } : {}),
		});
	}),

	listGovernanceProposals: orpc.query.input(ProposalQuerySchema).handler(({ input, context }) => {
		return context.ledger.GovernanceProposal.findMany({
			limit: input.limit,
			...(input.walletId ? { where: { walletId: input.walletId } } : {}),
		});
	}),

	// ─── Actions ────────────────────────────────────────────────────────────────

	proposeTransfer: orpc.action.input(ProposeTransferSchema).handler(({ input, context }) => {
		return context.ledger.MultisigWallet.exercise(input.walletCid, "ProposeTransfer", {
			proposer: input.proposer,
			recipient: input.recipient,
			txAmount: input.txAmount,
			txCurrency: input.txCurrency,
			description: input.description,
		});
	}),

	approveTransaction: orpc.action.input(ApproveProposalSchema).handler(({ input, context }) => {
		return context.ledger.TransactionProposal.exercise(input.proposalCid, "Approve", {
			approver: input.approver,
		});
	}),

	executeTransaction: orpc.action.input(ExecuteTransactionSchema).handler(({ input, context }) => {
		return context.ledger.TransactionProposal.exercise(input.proposalCid, "Execute", {
			executor: input.executor,
			walletCid: input.walletCid,
			iouCid: input.iouCid,
		});
	}),

	rejectTransaction: orpc.action.input(RejectProposalSchema).handler(({ input, context }) => {
		return context.ledger.TransactionProposal.exercise(input.proposalCid, "Reject", {
			rejector: input.rejector,
		});
	}),
});
