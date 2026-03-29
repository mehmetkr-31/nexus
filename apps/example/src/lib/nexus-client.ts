import {
	createNexusClient,
	packageDiscoveryPlugin,
	type StreamingActions,
	sandboxAuth,
	streamingPlugin,
	type TanstackQueryActions,
	tanstackQueryPlugin,
} from "@nexus-framework/react";

export const NEXUS_USER_ID = process.env.NEXT_PUBLIC_SANDBOX_USER_ID ?? "alice";

/**
 * Client-side Nexus instance.
 * Hooks close over this instance directly — no React Context needed.
 *
 * All React hooks are attached to this instance.
 */
export const nexus = await createNexusClient<TanstackQueryActions & StreamingActions>({
	baseUrl: process.env.NEXT_PUBLIC_CANTON_API_URL ?? "http://localhost:7575",
	plugins: [
		sandboxAuth({
			secret: process.env.NEXT_PUBLIC_SANDBOX_SECRET ?? "secret",
			userId: NEXUS_USER_ID,
		}),
		packageDiscoveryPlugin(),
		tanstackQueryPlugin(),
		streamingPlugin(),
	],
});
