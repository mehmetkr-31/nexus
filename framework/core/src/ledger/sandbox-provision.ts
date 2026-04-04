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
export async function provisionSandboxUser(options: ProvisionSandboxUserOptions): Promise<string> {
	const { ledgerApiUrl, userId, secret } = options;
	const manager = new JwtManager({ type: "sandbox", userId, secret });
	const adminToken = await manager.getAdminToken();

	const authHeaders = {
		Authorization: `Bearer ${adminToken}`,
		"Content-Type": "application/json",
	};
	const partyHint = userId.charAt(0).toUpperCase() + userId.slice(1);

	// ── Step 1: Allocate party (with retry for sandbox startup) ─────────────
	let partyId: string | undefined;

	const MAX_ALLOC_RETRIES = 10;
	const ALLOC_RETRY_DELAY_MS = 3000;

	for (let attempt = 1; attempt <= MAX_ALLOC_RETRIES; attempt++) {
		const res = await fetch(`${ledgerApiUrl}/v2/parties`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({ partyIdHint: partyHint, displayName: partyHint }),
		});

		if (res.ok) {
			const data = (await res.json()) as Record<string, unknown>;
			// Canton v2: { partyDetails: { party: "..." } } or { partyRecord: { party: "..." } }; older: { result: { partyId } } or { partyId }
			const rawPartyId =
				((data.partyDetails as Record<string, unknown>)?.party as string | undefined) ??
				((data.partyRecord as Record<string, unknown>)?.party as string | undefined) ??
				((data.result as Record<string, unknown>)?.partyId as string | undefined) ??
				(data.partyId as string | undefined) ??
				(data.party as string | undefined);
			// Canton 3.4.x appends a participant suffix after a period (e.g. "Alice::1220hash.participant").
			// Daml-LF only accepts the part before the first period in the fingerprint.
			partyId = rawPartyId ? toDamlLFPartyId(rawPartyId) : undefined;
			break;
		}

		const text = await res.text();

		if (text.includes("ALREADY_EXISTS") || text.includes("already exists")) {
			// Party already allocated — try to extract party ID from JSON error body first
			// (Canton 3.x returns structured JSON for most errors), then fall back to regex
			let extracted = false;
			try {
				const errBody = JSON.parse(text) as Record<string, unknown>;
				// Canton may embed the duplicate party ID in various fields
				const candidate =
					(errBody.party as string | undefined) ??
					(errBody.details as string | undefined) ??
					String(errBody.message ?? "").match(
						/party\s+([A-Za-z][A-Za-z0-9:#_-]*::[A-Za-z0-9+=/]+)/,
					)?.[1];
				if (candidate) {
					partyId = toDamlLFPartyId(candidate);
					extracted = true;
				}
			} catch {
				// Not JSON — fall through to regex
			}

			if (!extracted) {
				// Text error — try regex patterns for known Canton formats
				const match =
					text.match(/party\s+([^\s]+)\s+is already allocated/i) ??
					text.match(/partyId\s+['"]([^'"]+)['"]\s+already exists/i);
				if (match?.[1]) partyId = toDamlLFPartyId(match[1]);
			}
			break;
		}

		if (
			text.includes("PARTY_ALLOCATION_WITHOUT_CONNECTED_SYNCHRONIZER") &&
			attempt < MAX_ALLOC_RETRIES
		) {
			// Canton sandbox is still starting up — wait for the synchronizer to connect
			console.log(
				`[nexus:provision] Waiting for Canton synchronizer... (attempt ${attempt}/${MAX_ALLOC_RETRIES})`,
			);
			await new Promise<void>((resolve) => setTimeout(resolve, ALLOC_RETRY_DELAY_MS));
			continue;
		}

		throw new NexusLedgerError(`Failed to allocate party: ${res.status} ${text}`);
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
		// Canton v2: { partyDetails: [{ party, ... }] } or { partyRecords: [{ party, ... }] }
		// Older:     { result: [...] } or [...]
		type PartyRecord = Record<string, string>;
		const rawList = listData as Record<string, unknown>;
		const parties: PartyRecord[] = Array.isArray(listData)
			? listData
			: Array.isArray(rawList.partyDetails)
				? (rawList.partyDetails as PartyRecord[])
				: Array.isArray(rawList.partyRecords)
					? (rawList.partyRecords as PartyRecord[])
					: Array.isArray(rawList.result)
						? (rawList.result as PartyRecord[])
						: Array.isArray(rawList.parties)
							? (rawList.parties as PartyRecord[])
							: [];

		// Resolve whichever field holds the party ID (v2 uses `party`, older uses `partyId`)
		const getPartyId = (p: PartyRecord) => p.party ?? p.partyId;

		const found = parties.find(
			(p) =>
				getPartyId(p)?.toLowerCase().startsWith(`${userId.toLowerCase()}::`) ||
				p.displayName?.toLowerCase() === userId.toLowerCase(),
		);

		const resolvedId = found ? getPartyId(found) : undefined;
		if (!resolvedId) {
			throw new NexusLedgerError(`Could not find or allocate party for user "${userId}"`);
		}
		partyId = toDamlLFPartyId(resolvedId);
	}

	// ── Step 3: Create user (idempotent) ────────────────────────────────────
	const userRes = await fetch(`${ledgerApiUrl}/v2/users`, {
		method: "POST",
		headers: authHeaders,
		body: JSON.stringify({
			user: { id: userId, primaryParty: partyId, isDeactivated: false, identityProviderId: "" },
		}),
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

	if (!partyId) {
		throw new NexusLedgerError(
			`Could not resolve party ID for user "${userId}" after provisioning`,
		);
	}
	return partyId;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Canton 3.x party IDs may include a participant suffix after the fingerprint
 * (e.g. `"Alice::1220hash.participantName"`). The Daml-LF party spec only
 * allows characters in `[a-zA-Z0-9:#_-]`, so we strip everything from the
 * first period in the fingerprint segment onwards.
 *
 * `"Alice::1220hash.local"` → `"Alice::1220hash"`
 * `"Alice::1220hash"`       → `"Alice::1220hash"` (unchanged)
 */
function toDamlLFPartyId(partyId: string): string {
	const sepIdx = partyId.indexOf("::");
	if (sepIdx === -1) return partyId;
	const fingerprint = partyId.slice(sepIdx + 2);
	const dotIdx = fingerprint.indexOf(".");
	if (dotIdx === -1) return partyId;
	return `${partyId.slice(0, sepIdx + 2)}${fingerprint.slice(0, dotIdx)}`;
}
