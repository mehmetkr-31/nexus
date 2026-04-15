import { baseAppRouter } from "@nexus/api";
import { createContext } from "@nexus/api/context";
import { signetRouter } from "./signet-router";

export const appRouter = {
	...baseAppRouter,
	signet: signetRouter,
};

export type AppRouter = typeof appRouter;

export { createContext };
