import { Iou } from "@daml.js/nexus-example-0.0.1";
import type { ConstructNexusApi } from "@nexus-framework/core/server";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

// ─── Types ─────────────────────────────────────────────────────────────────
// IouPayload is the Daml-codegen type directly — no manual mirror needed.
// IouLedger is derived from the template map, so it stays in sync automatically.

export type IouPayload = Iou.Iou;
export type IouLedger = ConstructNexusApi<{ Iou: typeof Iou.Iou }>;

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

// ─── createIouRouter ───────────────────────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: oRPC ProcedureBuilder generics are resolved at the call site
export function createIouRouter(procedure: any) {
	type Ctx = { context: { ledger: IouLedger } };

	return {
		list: procedure
			.input(IouQuerySchema)
			.handler(({ input, context }: { input: z.infer<typeof IouQuerySchema> } & Ctx) =>
				context.ledger.Iou.findMany({
					limit: input.limit,
					...(input.owner ? { where: { owner: input.owner } } : {}),
				}),
			),

		get: procedure
			.input(z.object({ contractId: z.string().min(1) }))
			.handler(async ({ input, context }: { input: { contractId: string } } & Ctx) => {
				const contract = await context.ledger.Iou.findById(input.contractId);
				if (!contract) {
					throw new ORPCError("NOT_FOUND", { message: `Iou not found: ${input.contractId}` });
				}
				return contract;
			}),

		create: procedure
			.input(IouPayloadSchema)
			.handler(({ input, context }: { input: IouPayload } & Ctx) =>
				context.ledger.Iou.create(input),
			),

		transfer: procedure
			.input(IouTransferSchema)
			.handler(({ input, context }: { input: z.infer<typeof IouTransferSchema> } & Ctx) =>
				context.ledger.Iou.exercise(input.contractId, "Transfer", {
					newOwner: input.newOwner,
				}),
			),

		archive: procedure
			.input(IouArchiveSchema)
			.handler(({ input, context }: { input: z.infer<typeof IouArchiveSchema> } & Ctx) =>
				context.ledger.Iou.archive(input.contractId),
			),
	};
}
