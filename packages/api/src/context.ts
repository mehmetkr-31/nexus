import { auth } from "@nexus/auth";

export async function createContext({ req }: { req: Request }) {
	const session = await auth.api.getSession({ headers: req.headers });
	return { req, session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
