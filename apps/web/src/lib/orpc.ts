import { createNexusOrpc } from "@nexus-framework/orpc";
import { nexus } from "./nexus-server";

/**
 * Type-safe oRPC factory instance for Nexus.
 *
 * Use `orpc.query` for read-only procedures.
 * Use `orpc.action` for state-changing procedures.
 *
 * Benefits:
 * - Full TypeScript inference for ledger operations
 * - Automatic ledger context injection via nexus.forRequest(req)
 * - Built-in middleware: requireRole, rateLimit, errorHandler
 *
 * Example:
 * ```ts
 * export const router = orpc.router({
 *   listWallets: orpc.query
 *     .input(z.object({ limit: z.number() }))
 *     .handler(({ input, context }) =>
 *       context.ledger.MultisigWallet.findMany({ limit: input.limit })
 *     ),
 * });
 * ```
 */
export const orpc = createNexusOrpc(nexus);
