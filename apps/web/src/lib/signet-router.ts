import {
	AcceptMembershipSchema,
	ApproveGovernanceSchema,
	ApproveProposalSchema,
	CreateWalletSchema,
	ExecuteGovernanceSchema,
	ExecuteTransactionSchema,
	ProposeAddMemberSchema,
	ProposeChangeThresholdSchema,
	ProposeRemoveMemberSchema,
	ProposalQuerySchema,
	ProposeTransferSchema,
	RejectGovernanceSchema,
	RejectProposalSchema,
	WalletQuerySchema,
} from "@nexus/api/schemas/signet";
import { z } from "zod";
import { ledgerProcedure } from "./api";

/**
 * Signet multisig wallet router.
 *
 * Uses ledgerProcedure with automatic type inference - no manual types needed!
 * All Daml template types flow through automatically from nexus-types.ts.
 *
 * Benefits:
 * - `context.ledger.MultisigWallet` is fully typed
 * - Zero manual type annotations required
 * - Shared schemas from @nexus/api/schemas/signet
 */
export const signetRouter = {
	// ─── MultisigWallet Queries ─────────────────────────────────────────────────

	listWallets: ledgerProcedure.input(WalletQuerySchema).handler(({ input, context }) => {
		return context.ledger.MultisigWallet.findMany({
			limit: input.limit,
		});
	}),

	getWallet: ledgerProcedure
		.input(z.object({ contractId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const contract = await context.ledger.MultisigWallet.findById(input.contractId);
			if (!contract) {
				throw new Error(`Wallet not found: ${input.contractId}`);
			}
			return contract;
		}),

	// ─── Wallet Creation ────────────────────────────────────────────────────────

	createWallet: ledgerProcedure.input(CreateWalletSchema).handler(({ input, context }) => {
		return context.ledger.MultisigWallet.create({
			walletId: input.walletId,
			members: input.members,
			threshold: input.threshold,
			custodian: input.custodian,
		});
	}),

	// ─── Proposal Queries ───────────────────────────────────────────────────────

	listTransactionProposals: ledgerProcedure
		.input(ProposalQuerySchema)
		.handler(({ input, context }) => {
			return context.ledger.TransactionProposal.findMany({
				limit: input.limit,
				...(input.walletId ? { where: { walletId: input.walletId } } : {}),
			});
		}),

	listGovernanceProposals: ledgerProcedure
		.input(ProposalQuerySchema)
		.handler(({ input, context }) => {
			return context.ledger.GovernanceProposal.findMany({
				limit: input.limit,
				...(input.walletId ? { where: { walletId: input.walletId } } : {}),
			});
		}),

	// ─── Transaction Actions ────────────────────────────────────────────────────

	proposeTransfer: ledgerProcedure.input(ProposeTransferSchema).handler(({ input, context }) => {
		return context.ledger.MultisigWallet.exercise(input.walletCid, "ProposeTransfer", {
			proposer: input.proposer,
			recipient: input.recipient,
			txAmount: input.txAmount,
			txCurrency: input.txCurrency,
			description: input.description,
		});
	}),

	approveTransaction: ledgerProcedure.input(ApproveProposalSchema).handler(({ input, context }) => {
		return context.ledger.TransactionProposal.exercise(input.proposalCid, "Approve", {
			approver: input.approver,
		});
	}),

	executeTransaction: ledgerProcedure
		.input(ExecuteTransactionSchema)
		.handler(({ input, context }) => {
			return context.ledger.TransactionProposal.exercise(input.proposalCid, "Execute", {
				executor: input.executor,
				walletCid: input.walletCid,
				iouCid: input.iouCid,
			});
		}),

	rejectTransaction: ledgerProcedure.input(RejectProposalSchema).handler(({ input, context }) => {
		return context.ledger.TransactionProposal.exercise(input.proposalCid, "Reject", {
			rejector: input.rejector,
		});
	}),

	// ─── Governance Actions ─────────────────────────────────────────────────────

	proposeAddMember: ledgerProcedure.input(ProposeAddMemberSchema).handler(({ input, context }) => {
		return context.ledger.MultisigWallet.exercise(input.walletCid, "ProposeAddMember", {
			proposer: input.proposer,
			newMember: {
				party: input.newMemberParty,
				role: input.newMemberRole,
			},
		});
	}),

	proposeRemoveMember: ledgerProcedure
		.input(ProposeRemoveMemberSchema)
		.handler(({ input, context }) => {
			return context.ledger.MultisigWallet.exercise(input.walletCid, "ProposeRemoveMember", {
				proposer: input.proposer,
				memberToRemove: input.memberToRemove,
			});
		}),

	proposeChangeThreshold: ledgerProcedure
		.input(ProposeChangeThresholdSchema)
		.handler(({ input, context }) => {
			return context.ledger.MultisigWallet.exercise(input.walletCid, "ProposeChangeThreshold", {
				proposer: input.proposer,
				newThreshold: input.newThreshold,
			});
		}),

	approveGovernance: ledgerProcedure
		.input(ApproveGovernanceSchema)
		.handler(({ input, context }) => {
			return context.ledger.GovernanceProposal.exercise(input.proposalCid, "ApproveGovernance", {
				approver: input.approver,
			});
		}),

	executeGovernance: ledgerProcedure
		.input(ExecuteGovernanceSchema)
		.handler(({ input, context }) => {
			return context.ledger.GovernanceProposal.exercise(input.proposalCid, "ExecuteGovernance", {
				executor: input.executor,
				walletCid: input.walletCid,
			});
		}),

	rejectGovernance: ledgerProcedure.input(RejectGovernanceSchema).handler(({ input, context }) => {
		return context.ledger.GovernanceProposal.exercise(input.proposalCid, "RejectGovernance", {
			rejector: input.rejector,
		});
	}),

	// ─── PendingWalletUpdate Actions ────────────────────────────────────────────

	acceptMembership: ledgerProcedure.input(AcceptMembershipSchema).handler(({ input, context }) => {
		return context.ledger.PendingWalletUpdate.exercise(
			input.pendingUpdateCid,
			"AcceptMembership",
			{},
		);
	}),
};
