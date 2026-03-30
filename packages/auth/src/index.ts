import { expo } from "@better-auth/expo";
import { createDb } from "@nexus-framework/db";
import * as schema from "@nexus-framework/db/schema/auth";
import { env } from "@nexus-framework/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",

			schema: schema,
		}),
		trustedOrigins: [
			env.CORS_ORIGIN,
			"nexus-framework://",
			...(env.NODE_ENV === "development"
				? ["exp://", "exp://**", "exp://192.168.*.*:*/**", "http://localhost:8081"]
				: []),
		],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		plugins: [tanstackStartCookies(), expo()],
	});
}

export const auth = createAuth();
