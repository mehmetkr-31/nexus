import { createNexus, provisionSandboxUser, sandboxAuth } from "@nexus-framework/core";
import { cookies } from "next/headers";

export const CANTON_API_URL = process.env.CANTON_API_URL ?? "http://localhost:7575";
export const SANDBOX_USER_ID = process.env.SANDBOX_USER_ID ?? "alice";
export const IOU_TEMPLATE_ID = "nexus-example:Iou:Iou";

const SANDBOX_SECRET = process.env.SANDBOX_SECRET ?? "secret";

/**
 * Server-side Nexus client for use in Server Components and Actions.
 * Pass `partyId` once you have it to include it in the auth token.
 */
export async function getServerClient(partyId?: string) {
	await cookies();
	return createNexus({
		ledgerApiUrl: CANTON_API_URL,
		plugins: [
			sandboxAuth({
				userId: SANDBOX_USER_ID,
				partyId,
				secret: SANDBOX_SECRET,
			}),
		],
	});
}

/**
 * Resolves the current server session (client + partyId).
 * Auto-provisions the sandbox user if they don't exist yet.
 */
export async function resolveServerSession() {
	const client = await getServerClient();

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

		console.log(`Provisioning sandbox user "${SANDBOX_USER_ID}"...`);
		const partyId = await provisionSandboxUser({
			ledgerApiUrl: CANTON_API_URL,
			userId: SANDBOX_USER_ID,
			secret: SANDBOX_SECRET,
		});
		return { client: await getServerClient(partyId), partyId };
	}
}
