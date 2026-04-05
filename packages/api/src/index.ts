import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const o = os.$context<Context>();

// ─── publicProcedure ──────────────────────────────────────────────────────────

export const publicProcedure = o;

// ─── protectedProcedure ───────────────────────────────────────────────────────

export const protectedProcedure = o.use(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({ context: { session: context.session } });
});

// ─── createLedgerProcedure ────────────────────────────────────────────────────

/**
 * Creates a fully-typed oRPC procedure that injects a Nexus ledger context.
 *
 * The `extractor` receives the raw `Request` and returns a typed ledger
 * context (the result of `nexus.forRequest(req)` or `nexus.forParty(id, token)`).
 * The resulting `context.ledger` field is typed as `TLedger` in every handler.
 *
 * No `any` — the full type flows through oRPC's middleware chain.
 *
 * @example
 * ```ts
 * // lib/api.ts
 * import { createLedgerProcedure } from "@nexus/api"
 * import { nexus } from "~/lib/nexus-server"
 *
 * export const ledgerProcedure = createLedgerProcedure(nexus.forRequest)
 *
 * // In a router file:
 * export const iouRouter = {
 *   list: ledgerProcedure
 *     .handler(({ context }) => context.ledger.Iou.findMany()),
 *
 *   create: ledgerProcedure
 *     .input(z.object({ amount: z.string(), currency: z.string() }))
 *     .handler(({ input, context }) =>
 *       context.ledger.Iou.create({
 *         owner: context.session.user.id,
 *         amount: input.amount,
 *         currency: input.currency,
 *       })
 *     ),
 * }
 * ```
 */
export function createLedgerProcedure<TLedger>(extractor: (req: Request) => Promise<TLedger>) {
	return o.use(async ({ context, next }) => {
		let ledger: TLedger;
		try {
			ledger = await extractor(context.req);
		} catch {
			throw new ORPCError("UNAUTHORIZED", {
				message: "Invalid or missing Nexus session.",
			});
		}
		return next({ context: { ledger } });
	});
}

// ─── Re-export ────────────────────────────────────────────────────────────────

export type { Context };
export { baseAppRouter } from "./routers/index";
