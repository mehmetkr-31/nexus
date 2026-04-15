import { baseAppRouter, createLedgerProcedure } from "@nexus/api";
import { createContext } from "@nexus/api/context";
import { signetRouter } from "./signet-router";
import { nexus } from "./nexus-server";

/**
 * Typed ledger procedure with automatic context injection.
 * Use this in all router definitions for full type inference.
 */
export const ledgerProcedure = createLedgerProcedure(nexus.forRequest);

export const appRouter = {
	...baseAppRouter,
	signet: signetRouter,
};

export type AppRouter = typeof appRouter;

export { createContext };
