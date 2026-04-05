import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

// ─── Base app router ──────────────────────────────────────────────────────────
//
// Ledger routes are NOT included here — they are domain-specific and must be
// wired in each app using `createLedgerProcedure(nexus.forRequest)`.
//
// Example:
//
//   // apps/my-app/src/lib/api.ts
//   import { createLedgerProcedure, baseAppRouter } from "@nexus/api"
//   import { createIouRouter } from "~/routers/iou"
//   import { nexus } from "~/lib/nexus-server"
//
//   export const appRouter = {
//     ...baseAppRouter,
//     iou: createIouRouter(createLedgerProcedure(nexus.forRequest)),
//   }
//
//   export type AppRouter = typeof appRouter

export const baseAppRouter = {
	healthCheck: publicProcedure.handler(() => "OK" as const),

	me: protectedProcedure.handler(({ context }) => ({
		id: context.session?.user.id,
		email: context.session?.user.email,
		name: context.session?.user.name,
	})),
};

export const appRouter = baseAppRouter;

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
