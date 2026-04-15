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

// ─── Ledger Procedure Pattern ─────────────────────────────────────────────────
//
// The procedure-based approach provides maximum flexibility:
//
// 1. Each app creates its own ledgerProcedure with nexus.forRequest
// 2. Router definitions directly use the procedure
// 3. Full type inference without factory overhead
// 4. Compatible with all oRPC middleware
//
// Benefits over factory pattern:
// - No app-specific factory needed
// - Easier to compose with other middlewares
// - More explicit control flow
// - Smaller bundle size (no unused factory code)
// - Zero manual type annotations in handlers

/**
 * Creates a fully-typed oRPC procedure that injects a Nexus ledger context.
 *
 * The `extractor` receives the raw `Request` and returns a typed ledger
 * context (the result of `nexus.forRequest(req)` or `nexus.forParty(id, token)`).
 * The resulting `context.ledger` field is typed as `TLedger` in every handler.
 *
 * **No manual type annotations needed** — full type inference through oRPC's middleware chain.
 *
 * @template TLedger - The ledger API type from ConstructNexusApi<T>
 * @param extractor - Function to extract ledger from request (nexus.forRequest)
 * @returns An oRPC procedure with ledger context automatically injected
 *
 * @example
 * ```ts
 * // Step 1: Export ledgerProcedure from your api.ts
 * import { createLedgerProcedure } from "@nexus/api"
 * import { nexus } from "~/lib/nexus-server"
 *
 * export const ledgerProcedure = createLedgerProcedure(nexus.forRequest)
 *
 * // Step 2: Use in router files (no type annotations needed!)
 * import { ledgerProcedure } from "./api"
 *
 * export const myRouter = {
 *   list: ledgerProcedure
 *     .input(z.object({ limit: z.number() }))
 *     .handler(({ input, context }) =>
 *       // ✓ context.ledger is fully typed - no manual annotations!
 *       context.ledger.MyTemplate.findMany({ limit: input.limit })
 *     ),
 *
 *   create: ledgerProcedure
 *     .input(CreateSchema)
 *     .handler(({ input, context }) =>
 *       // ✓ Full type inference for all ledger operations
 *       context.ledger.MyTemplate.create(input)
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


export { baseAppRouter } from "./routers/index";
export type { Context };
