import { createContext } from "@nexus/api/context";
import { createLedgerProcedure, baseAppRouter } from "@nexus/api";
import { createIouRouter } from "@/routers/iou";
import { nexus } from "./nexus-server";

export const appRouter = {
	...baseAppRouter,
	iou: createIouRouter(createLedgerProcedure(nexus.forRequest)),
};

export type AppRouter = typeof appRouter;

export { createContext };
