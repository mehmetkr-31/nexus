import { type CantonParty, NexusAuthError } from "../types/index.ts";

interface UserRightsResponse {
	participantAdmin?: boolean;
	canActAs?: string[];
	canReadAs?: string[];
}

interface CacheEntry {
	partyId: string;
	expiresAt: number;
}

// ─── PartyIdResolver ─────────────────────────────────────────────────────────

export class PartyIdResolver {
	private readonly cache = new Map<string, CacheEntry>();
	private readonly cacheTtlMs: number;
	private readonly baseUrl: string;
	private readonly getToken: () => Promise<string>;

	constructor(options: {
		baseUrl: string;
		getToken: () => Promise<string>;
		cacheTtlMs?: number;
	}) {
		this.baseUrl = options.baseUrl.replace(/\/$/, "");
		this.getToken = options.getToken;
		this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000; // 5 min default
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
		return rights.canActAs ?? [];
	}

	/** Fetch all parties the current token can read as */
	async getReadAsParties(userId: string): Promise<string[]> {
		const rights = await this.fetchUserRights(userId);
		return rights.canReadAs ?? [];
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
		// First try: /v2/users/:userId to get primaryParty
		const token = await this.getToken();
		const res = await fetch(`${this.baseUrl}/v2/users/${encodeURIComponent(userId)}`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (res.ok) {
			const data = (await res.json()) as { primaryParty?: string };
			if (data.primaryParty) return data.primaryParty;
		}

		// Fallback: derive from actAs rights
		const rights = await this.fetchUserRights(userId);
		const actAs = rights.canActAs ?? [];
		if (actAs.length === 0) {
			throw new NexusAuthError(
				`Cannot resolve Party ID for userId "${userId}": no actAs rights found`,
			);
		}
		// Return first actAs party as primary
		return actAs[0]!;
	}

	private async fetchUserRights(userId: string): Promise<UserRightsResponse> {
		const token = await this.getToken();
		const res = await fetch(`${this.baseUrl}/v2/users/${encodeURIComponent(userId)}/rights`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!res.ok) {
			throw new NexusAuthError(
				`Failed to fetch user rights for "${userId}": ${res.status} ${res.statusText}`,
				await res.text().catch(() => undefined),
			);
		}

		return res.json() as Promise<UserRightsResponse>;
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a CantonParty for display */
export function formatParty(party: CantonParty): string {
	return party.displayName ? `${party.displayName} (${party.partyId})` : party.partyId;
}
