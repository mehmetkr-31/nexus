import { JwtManager } from "../auth/jwt-manager.ts";
import { NexusLedgerError } from "../types/index.ts";

export interface ProvisionSandboxUserOptions {
	/** Canton Ledger API base URL */
	ledgerApiUrl: string;
	/** User ID to provision */
	userId: string;
	/** HMAC-256 secret for signing admin tokens */
	secret: string;
}

/**
 * Provision a new user in Canton Sandbox development mode.
 *
 * Handles the full flow:
 * 1. Allocates a Canton party (idempotent)
 * 2. Creates a ledger user with that party as primary
 * 3. Grants `canActAs` and `canReadAs` rights
 *
 * Returns the fully-qualified party ID (e.g. `"Alice::122059a1..."`).
 *
 * **NOT for production use** — requires sandbox admin access.
 *
 * @example
 * ```ts
 * import { provisionSandboxUser } from "@nexus-framework/core";
 *
 * const partyId = await provisionSandboxUser({
 *   ledgerApiUrl: "http://localhost:7575",
 *   userId: "alice",
 *   secret: "secret",
 * });
 * // => "Alice::122059a10c67ef1bb38e4e7..."
 * ```
 */
export async function provisionSandboxUser(
	options: ProvisionSandboxUserOptions,
): Promise<string> {
	const { ledgerApiUrl, userId, secret } = options;
	const manager = new JwtManager({ type: "sandbox", userId, secret });
	const adminToken = await manager.getAdminToken();

	const authHeaders = {
		Authorization: `Bearer ${adminToken}`,
		"Content-Type": "application/json",
	};
	const partyHint = userId.charAt(0).toUpperCase() + userId.slice(1);

	// ── Step 1: Allocate party (idempotent) ──────────────────────────────────
	let partyId: string | undefined;

	const partyRes = await fetch(`${ledgerApiUrl}/v2/parties`, {
		method: "POST",
		headers: authHeaders,
		body: JSON.stringify({ partyIdHint: partyHint, displayName: partyHint }),
	});

	if (partyRes.ok) {
		const data = (await partyRes.json()) as Record<string, unknown>;
		partyId =
			((data.result as Record<string, unknown>)?.partyId as string) ??
			(data.partyId as string | undefined);
	} else {
		const text = await partyRes.text();
		if (!text.includes("ALREADY_EXISTS") && !text.includes("already exists")) {
			throw new NexusLedgerError(`Failed to allocate party: ${partyRes.status} ${text}`);
		}
		// Try to extract the existing party ID from the error body
		const match =
			text.match(/party\s+([^\s]+)\s+is already allocated/i) ??
			text.match(/partyId\s+['"]([^'"]+)['"]\s+already exists/i);
		if (match?.[1]) partyId = match[1];
	}

	// ── Step 2: Discover party by listing (fallback) ─────────────────────────
	if (!partyId) {
		const listRes = await fetch(`${ledgerApiUrl}/v2/parties`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});
		if (!listRes.ok) {
			throw new NexusLedgerError(`Failed to list parties: ${listRes.status}`);
		}
		const listData = (await listRes.json()) as unknown;
		const parties: Array<Record<string, string>> = Array.isArray(listData)
			? listData
			: ((listData as Record<string, unknown>).result as Array<Record<string, string>>) ??
				((listData as Record<string, unknown>).parties as Array<Record<string, string>>) ??
				[];

		const found =
			parties.find(
				(p) =>
					p.partyId?.toLowerCase().startsWith(`${userId.toLowerCase()}::`) ||
					p.displayName?.toLowerCase() === userId.toLowerCase(),
			) ?? parties.find((p) => p.partyId?.includes("::"));

		if (!found?.partyId) {
			throw new NexusLedgerError(`Could not find or allocate party for user "${userId}"`);
		}
		partyId = found.partyId;
	}

	// ── Step 3: Create user (idempotent) ────────────────────────────────────
	const userRes = await fetch(`${ledgerApiUrl}/v2/users`, {
		method: "POST",
		headers: authHeaders,
		body: JSON.stringify({ user: { userId, primaryParty: partyId } }),
	});

	if (!userRes.ok) {
		const text = await userRes.text();
		if (!text.includes("ALREADY_EXISTS") && !text.includes("already exists")) {
			throw new NexusLedgerError(`Failed to create user: ${userRes.status} ${text}`);
		}
	}

	// ── Step 4: Grant rights (idempotent) ────────────────────────────────────
	await fetch(`${ledgerApiUrl}/v2/users/${userId}/rights`, {
		method: "POST",
		headers: authHeaders,
		body: JSON.stringify({
			rights: [
				{ type: "canActAs", partyId },
				{ type: "canReadAs", partyId },
			],
		}),
	});

	return partyId;
}
