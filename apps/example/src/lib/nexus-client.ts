import { Iou } from "@daml.js/nexus-example-0.0.1";
import {
	createNexusClient,
	fetchMiddlewarePlugin,
	identityPlugin,
	optimisticUiPlugin,
	packageDiscoveryPlugin,
	sandboxAuth,
	streamingPlugin,
	tanstackQueryPlugin,
} from "@nexus-framework/react";

export const NEXUS_USER_ID = process.env.NEXT_PUBLIC_SANDBOX_USER_ID ?? "alice";

/**
 * Client-side Nexus instance.
 * Hooks close over this instance directly — no React Context needed.
 *
 * All React hooks are attached to this instance.
 */
export const nexus = await createNexusClient({
	// Use the Next.js proxy in the browser to bypass CORS, fall back to direct URL on server
	baseUrl:
		typeof window !== "undefined"
			? "/api/ledger"
			: (process.env.NEXT_PUBLIC_CANTON_API_URL ?? "http://localhost:7575"),
	types: {
		Iou: Iou.Iou,
	},
	plugins: [
		sandboxAuth({
			// WARNING: NEXT_PUBLIC_ prefix embeds this value in the client bundle.
			// This is intentional for sandbox/dev only — never use a real secret here.
			secret: process.env.NEXT_PUBLIC_SANDBOX_SECRET ?? "secret",
			userId: NEXUS_USER_ID,
		}),
		fetchMiddlewarePlugin({
			onRequest: (config) => {
				console.log(`[${config.method}] ${config.url}`);
				return config;
			},
			onResponse: (response, config) => {
				console.log(`[${config.method}] ${config.url} → ${response.status}`);
			},
		}),
		optimisticUiPlugin({
			updates: [
				{
					// Matches the template ID (can be partial or full)
					templateId: "Iou",
					onChoice: (choice, _arg, contract) => {
						// Consuming choices (like Archive) return null to remove from cache
						if (choice.toLowerCase().includes("archive")) {
							return null;
						}

						// Return the current payload as the optimistic state
						return contract.payload as Partial<typeof contract.payload>;
					},
				},
			],
		}),
		packageDiscoveryPlugin(),
		identityPlugin(),
		tanstackQueryPlugin(),
		streamingPlugin(),
	],
});
