import type { Iou } from "@daml.js/nexus-example-0.0.1";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { ledgerProcedure } from "../lib/api";

// ─── Schemas ───────────────────────────────────────────────────────────────

export const IouPayloadSchema = z.object({
	issuer: z.string().min(1),
	owner: z.string().min(1),
	amount: z.string().min(1),
	currency: z.string().min(1),
	observers: z.array(z.string()).default([]),
});

export const IouTransferSchema = z.object({
	contractId: z.string().min(1),
	newOwner: z.string().min(1),
});

export const IouArchiveSchema = z.object({
	contractId: z.string().min(1),
});

export const IouQuerySchema = z.object({
	limit: z.number().int().min(1).max(1000).optional().default(50),
	owner: z.string().optional(),
});

// ─── Type Helper ───────────────────────────────────────────────────────────

export type IouPayload = Iou.Iou;

// ─── IOU Router ────────────────────────────────────────────────────────────

/**
 * IOU router with automatic type inference.
 * No manual type annotations needed - full type safety through ledgerProcedure!
 */
export const iouRouter = {
	list: ledgerProcedure.input(IouQuerySchema).handler(({ input, context }) =>
		context.ledger.Iou.findMany({
			limit: input.limit,
			...(input.owner ? { where: { owner: input.owner } } : {}),
		}),
	),

	get: ledgerProcedure
		.input(z.object({ contractId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const contract = await context.ledger.Iou.findById(input.contractId);
			if (!contract) {
				throw new ORPCError("NOT_FOUND", { message: `Iou not found: ${input.contractId}` });
			}
			return contract;
		}),

	create: ledgerProcedure
		.input(IouPayloadSchema)
		.handler(({ input, context }) => context.ledger.Iou.create(input)),

	transfer: ledgerProcedure.input(IouTransferSchema).handler(({ input, context }) =>
		context.ledger.Iou.exercise(input.contractId, "Transfer", {
			newOwner: input.newOwner,
		}),
	),

	archive: ledgerProcedure
		.input(IouArchiveSchema)
		.handler(({ input, context }) => context.ledger.Iou.archive(input.contractId)),
};
