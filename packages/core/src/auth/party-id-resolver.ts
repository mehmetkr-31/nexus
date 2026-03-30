import { type CantonParty, NexusAuthError, NexusLedgerError } from "../types/index.ts";

// Canton v2 (3.x): rights are in a flat array of { type, partyId } objects
// Older Canton / legacy: { canActAs: string[], canReadAs: string[] }
interface UserRightsResponse {
	participantAdmin?: boolean;
	canActAs?: string[];
	canReadAs?: string[];
	// Canton 3.x format
	rights?: Array<{ type: string; partyId?: string }>;
}

interface CacheEntry {
	partyId: string;
	expiresAt: number;
}

// ─── PartyIdResolver ─────────────────────────────────────────────────────────

export class PartyIdResolver {
	private readonly cache = new Map<string, CacheEntry>();
	private readonly cacheTtlMs: number;

	constructor(
		private readonly client: import("../client/canton-client.ts").CantonClient,
		options?: { cacheTtlMs?: number },
	) {
		this.cacheTtlMs = options?.cacheTtlMs ?? 5 * 60 * 1000; // 5 min default
	}

	/**
	 * Resolve a userId to its primary Canton Party ID.
	 * Result is cached for `cacheTtlMs` milliseconds.
	 */
	async resolvePartyId(userId: string): Promise<string> {
		const cached = this.cache.get(userId);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.partyId;
		}

		const partyId = await this.fetchPartyId(userId);
		this.cache.set(userId, { partyId, expiresAt: Date.now() + this.cacheTtlMs });
		return partyId;
	}

	/** Fetch all parties the current token can act as */
	async getActAsParties(userId: string): Promise<string[]> {
		const rights = await this.fetchUserRights(userId);
		return normalizeActAs(rights);
	}

	/** Fetch all parties the current token can read as */
	async getReadAsParties(userId: string): Promise<string[]> {
		const rights = await this.fetchUserRights(userId);
		return normalizeReadAs(rights);
	}

	/** Invalidate cached entry for a userId */
	invalidate(userId: string): void {
		this.cache.delete(userId);
	}

	clearCache(): void {
		this.cache.clear();
	}

	// ─── Private ───────────────────────────────────────────────────────────────

	private async fetchPartyId(userId: string): Promise<string> {
		let data: Record<string, unknown>;
		try {
			data = await this.client.request<Record<string, unknown>>(
				"GET",
				`/v2/users/${encodeURIComponent(userId)}`,
			);
		} catch (err) {
			if (err instanceof NexusLedgerError && err.statusCode === 404) {
				throw new NexusAuthError(`User "${userId}" not found (404): USER_NOT_FOUND`);
			}
			throw err;
		}

		// Canton 3.x: { user: { primaryParty: "..." } }
		// Older: { primaryParty: "..." }
		const primaryParty =
			((data.user as Record<string, unknown> | undefined)?.primaryParty as string | undefined) ??
			(data.primaryParty as string | undefined);
		// Strip participant suffix (Canton 3.x adds ".participantName" to fingerprint)
		if (primaryParty) return stripParticipantSuffix(primaryParty);

		// Fallback: derive from actAs rights
		const rights = await this.fetchUserRights(userId);
		const actAs = normalizeActAs(rights);
		if (actAs.length === 0) {
			throw new NexusAuthError(
				`Cannot resolve Party ID for userId "${userId}": no actAs rights found`,
			);
		}
		return actAs[0] as string;
	}

	private async fetchUserRights(userId: string): Promise<UserRightsResponse> {
		return this.client.request<UserRightsResponse>(
			"GET",
			`/v2/users/${encodeURIComponent(userId)}/rights`,
		);
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a CantonParty for display */
export function formatParty(party: CantonParty): string {
	return party.displayName ? `${party.displayName} (${party.partyId})` : party.partyId;
}

/**
 * Normalize actAs parties from either Canton 3.x `{ rights: [{type, partyId}] }`
 * or older `{ canActAs: string[] }` response format.
 */
function normalizeActAs(rights: UserRightsResponse): string[] {
	if (rights.rights) {
		return rights.rights.flatMap((r) =>
			r.type === "canActAs" && r.partyId ? [stripParticipantSuffix(r.partyId)] : [],
		);
	}
	return (rights.canActAs ?? []).map(stripParticipantSuffix);
}

function normalizeReadAs(rights: UserRightsResponse): string[] {
	if (rights.rights) {
		return rights.rights.flatMap((r) =>
			r.type === "canReadAs" && r.partyId ? [stripParticipantSuffix(r.partyId)] : [],
		);
	}
	return (rights.canReadAs ?? []).map(stripParticipantSuffix);
}

/**
 * Canton 3.x party IDs may include a participant suffix after the fingerprint
 * (e.g. `"Alice::1220hash.participantName"`). Strip the suffix so the party ID
 * is Daml-LF compatible: only `[a-zA-Z0-9:#_-]` characters.
 */
function stripParticipantSuffix(partyId: string): string {
	const sepIdx = partyId.indexOf("::");
	if (sepIdx === -1) return partyId;
	const fingerprint = partyId.slice(sepIdx + 2);
	const dotIdx = fingerprint.indexOf(".");
	if (dotIdx === -1) return partyId;
	return `${partyId.slice(0, sepIdx + 2)}${fingerprint.slice(0, dotIdx)}`;
}
