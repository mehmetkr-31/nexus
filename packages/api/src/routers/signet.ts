import type { MultisigWallet } from "@daml.js/nexus-example-0.0.1";
import type { ConstructNexusApi } from "@nexus-framework/core/server";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

// ─── Types ─────────────────────────────────────────────────────────────────

export type SignetLedger = ConstructNexusApi<{
	MultisigWallet: typeof MultisigWallet.MultisigWallet;
	TransactionProposal: typeof MultisigWallet.TransactionProposal;
	GovernanceProposal: typeof MultisigWallet.GovernanceProposal;
	PendingWalletUpdate: typeof MultisigWallet.PendingWalletUpdate;
}>;

// ─── Schemas ───────────────────────────────────────────────────────────────

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

// ─── createSignetRouter ───────────────────────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: oRPC ProcedureBuilder generics are resolved at the call site
export function createSignetRouter(procedure: any) {
	type Ctx = { context: { ledger: SignetLedger } };

	return {
		// --- MultisigWallet Queries ---
		listWallets: procedure
			.input(WalletQuerySchema)
			.handler(({ input, context }: { input: z.infer<typeof WalletQuerySchema> } & Ctx) =>
				context.ledger.MultisigWallet.findMany({
					limit: input.limit,
				}),
			),

		getWallet: procedure
			.input(z.object({ contractId: z.string().min(1) }))
			.handler(async ({ input, context }: { input: { contractId: string } } & Ctx) => {
				const contract = await context.ledger.MultisigWallet.findById(input.contractId);
				if (!contract) {
					throw new ORPCError("NOT_FOUND", {
						message: `Wallet not found: ${input.contractId}`,
					});
				}
				return contract;
			}),

		// --- Proposal Queries ---
		listTransactionProposals: procedure
			.input(ProposalQuerySchema)
			.handler(({ input, context }: { input: z.infer<typeof ProposalQuerySchema> } & Ctx) =>
				context.ledger.TransactionProposal.findMany({
					limit: input.limit,
					...(input.walletId ? { where: { walletId: input.walletId } } : {}),
				}),
			),

		listGovernanceProposals: procedure
			.input(ProposalQuerySchema)
			.handler(({ input, context }: { input: z.infer<typeof ProposalQuerySchema> } & Ctx) =>
				context.ledger.GovernanceProposal.findMany({
					limit: input.limit,
					...(input.walletId ? { where: { walletId: input.walletId } } : {}),
				}),
			),

		// --- Actions ---
		proposeTransfer: procedure
			.input(ProposeTransferSchema)
			.handler(({ input, context }: { input: z.infer<typeof ProposeTransferSchema> } & Ctx) =>
				context.ledger.MultisigWallet.exercise(input.walletCid, "ProposeTransfer", {
					proposer: input.proposer,
					recipient: input.recipient,
					txAmount: input.txAmount,
					txCurrency: input.txCurrency,
					description: input.description,
				}),
			),

		approveTransaction: procedure
			.input(ApproveProposalSchema)
			.handler(({ input, context }: { input: z.infer<typeof ApproveProposalSchema> } & Ctx) =>
				context.ledger.TransactionProposal.exercise(input.proposalCid, "Approve", {
					approver: input.approver,
				}),
			),

		executeTransaction: procedure
			.input(ExecuteTransactionSchema)
			.handler(({ input, context }: { input: z.infer<typeof ExecuteTransactionSchema> } & Ctx) =>
				context.ledger.TransactionProposal.exercise(input.proposalCid, "Execute", {
					executor: input.executor,
					walletCid: input.walletCid,
					iouCid: input.iouCid,
				}),
			),

		rejectTransaction: procedure
			.input(RejectProposalSchema)
			.handler(({ input, context }: { input: z.infer<typeof RejectProposalSchema> } & Ctx) =>
				context.ledger.TransactionProposal.exercise(input.proposalCid, "Reject", {
					rejector: input.rejector,
				}),
			),
	};
}
