/**
 * Server-side Nexus helpers for Next.js Server Components and Actions.
 *
 * Uses the unified `nexus` instance from nexus-server.ts.
 * Auto-provisions the sandbox user on first run.
 */
import { provisionSandboxUser } from "@nexus-framework/core";
import { tanstackQueryPlugin } from "@nexus-framework/react/server";
import { cookies } from "next/headers";
import { nexus } from "./nexus-server";

export const CANTON_API_URL = process.env.CANTON_API_URL ?? "http://localhost:7575";
export const SANDBOX_USER_ID = process.env.SANDBOX_USER_ID ?? "alice";
export const IOU_TEMPLATE_ID = "nexus-example:Iou:Iou";

const SANDBOX_SECRET = process.env.SANDBOX_SECRET ?? "secret";

/**
 * Resolves the current server session (client + partyId).
 * Auto-provisions the sandbox user if they don't exist yet.
 *
 * Returns the unified NexusClient from the nexus server instance,
 * scoped to the resolved partyId.
 */
export async function resolveServerSession() {
	// Touch cookies() to opt this into dynamic rendering in Next.js
	await cookies();

	const client = nexus.client;

	try {
		const partyId = await client.auth.partyId.resolvePartyId(SANDBOX_USER_ID);
		return { client, partyId };
	} catch (err: unknown) {
		const msg = String((err as { message?: string })?.message ?? err);
		const isNotFound =
			(err as { statusCode?: number })?.statusCode === 404 ||
			msg.includes("404") ||
			msg.includes("USER_NOT_FOUND");

		if (!isNotFound) throw err;

		console.log(`[Nexus] Provisioning sandbox user "${SANDBOX_USER_ID}"...`);
		const partyId = await provisionSandboxUser({
			ledgerApiUrl: CANTON_API_URL,
			userId: SANDBOX_USER_ID,
			secret: SANDBOX_SECRET,
		});
		return { client, partyId };
	}
}
