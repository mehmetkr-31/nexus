import { baseAppRouter, createLedgerProcedure } from "@nexus/api";
import { createContext } from "@nexus/api/context";
import { createSignetRouter } from "@nexus/api/routers/signet";
import { nexus } from "./nexus-server";

export const appRouter = {
	...baseAppRouter,
	signet: createSignetRouter(createLedgerProcedure(nexus.forRequest)),
};

export type AppRouter = typeof appRouter;

export { createContext };
