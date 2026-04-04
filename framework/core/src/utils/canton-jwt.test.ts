import { describe, expect, test } from "bun:test";
import {
	describeCantonToken,
	extractCantonRights,
	getCantonTokenFormat,
	getParticipantIdFromToken,
	isAudienceBasedToken,
	isScopeBasedToken,
} from "./canton-jwt.ts";
import type { JwtPayload } from "./jwt.ts";

// ─── isAudienceBasedToken ─────────────────────────────────────────────────────

describe("isAudienceBasedToken", () => {
	test("returns true for audience-based Canton token", () => {
		const payload: JwtPayload = {
			sub: "alice",
			aud: "https://daml.com/jwt/aud/participant/sandbox-participant",
		};
		expect(isAudienceBasedToken(payload)).toBe(true);
	});

	test("returns true when aud is an array containing Canton aud", () => {
		const payload: JwtPayload = {
			sub: "alice",
			aud: ["some-other-audience", "https://daml.com/jwt/aud/participant/prod-participant"],
		};
		expect(isAudienceBasedToken(payload)).toBe(true);
	});

	test("returns false for scope-based token", () => {
		const payload: JwtPayload = {
			sub: "alice",
			scope: "daml_ledger_api",
			aud: "prod-participant",
		};
		expect(isAudienceBasedToken(payload)).toBe(false);
	});

	test("returns false when aud is absent", () => {
		expect(isAudienceBasedToken({ sub: "alice" })).toBe(false);
	});
});

// ─── isScopeBasedToken ────────────────────────────────────────────────────────

describe("isScopeBasedToken", () => {
	test("returns true for scope-based Canton token", () => {
		const payload: JwtPayload = {
			sub: "alice",
			scope: "daml_ledger_api",
		};
		expect(isScopeBasedToken(payload)).toBe(true);
	});

	test("returns true when scope contains daml_ledger_api among others", () => {
		const payload: JwtPayload = {
			sub: "alice",
			scope: "openid profile daml_ledger_api",
		};
		expect(isScopeBasedToken(payload)).toBe(true);
	});

	test("returns false when scope is absent", () => {
		expect(isScopeBasedToken({ sub: "alice" })).toBe(false);
	});

	test("returns false for unrelated scope", () => {
		const payload: JwtPayload = { sub: "alice", scope: "openid profile" };
		expect(isScopeBasedToken(payload)).toBe(false);
	});
});

// ─── getCantonTokenFormat ─────────────────────────────────────────────────────

describe("getCantonTokenFormat", () => {
	test("detects audience-based format", () => {
		expect(
			getCantonTokenFormat({
				aud: "https://daml.com/jwt/aud/participant/x",
			}),
		).toBe("audience-based");
	});

	test("detects scope-based format", () => {
		expect(getCantonTokenFormat({ scope: "daml_ledger_api" })).toBe("scope-based");
	});

	test("returns unknown for unrecognized token", () => {
		expect(getCantonTokenFormat({ sub: "x" })).toBe("unknown");
	});

	test("audience-based takes priority over scope-based when both present", () => {
		const payload: JwtPayload = {
			aud: "https://daml.com/jwt/aud/participant/x",
			scope: "daml_ledger_api",
		};
		expect(getCantonTokenFormat(payload)).toBe("audience-based");
	});
});

// ─── getParticipantIdFromToken ────────────────────────────────────────────────

describe("getParticipantIdFromToken", () => {
	test("extracts participant ID from audience-based token", () => {
		const payload: JwtPayload = {
			aud: "https://daml.com/jwt/aud/participant/sandbox-participant-abc123",
		};
		expect(getParticipantIdFromToken(payload)).toBe("sandbox-participant-abc123");
	});

	test("extracts participant ID from array aud", () => {
		const payload: JwtPayload = {
			aud: ["unrelated", "https://daml.com/jwt/aud/participant/prod-123"],
		};
		expect(getParticipantIdFromToken(payload)).toBe("prod-123");
	});

	test("returns null for scope-based token", () => {
		const payload: JwtPayload = { scope: "daml_ledger_api" };
		expect(getParticipantIdFromToken(payload)).toBeNull();
	});

	test("returns null when aud is absent", () => {
		expect(getParticipantIdFromToken({ sub: "x" })).toBeNull();
	});

	test("returns null for empty participant ID (malformed aud)", () => {
		const payload: JwtPayload = {
			aud: "https://daml.com/jwt/aud/participant/",
		};
		expect(getParticipantIdFromToken(payload)).toBeNull();
	});
});

// ─── extractCantonRights ──────────────────────────────────────────────────────

describe("extractCantonRights", () => {
	test("extracts actAs and readAs from legacy claim", () => {
		const payload: JwtPayload = {
			"https://daml.com/ledger-api": {
				actAs: ["Alice::abc"],
				readAs: ["Bob::def"],
				admin: false,
			},
		};
		const rights = extractCantonRights(payload);
		expect(rights.actAs).toEqual(["Alice::abc"]);
		expect(rights.readAs).toEqual(["Bob::def"]);
		expect(rights.admin).toBe(false);
	});

	test("returns empty arrays when claim is absent", () => {
		const rights = extractCantonRights({ sub: "alice" });
		expect(rights.actAs).toEqual([]);
		expect(rights.readAs).toEqual([]);
		expect(rights.admin).toBe(false);
	});

	test("returns admin: true for admin token", () => {
		const payload: JwtPayload = {
			"https://daml.com/ledger-api": {
				actAs: [],
				readAs: [],
				admin: true,
			},
		};
		expect(extractCantonRights(payload).admin).toBe(true);
	});
});

// ─── describeCantonToken ──────────────────────────────────────────────────────

describe("describeCantonToken", () => {
	test("produces correct summary for audience-based token", () => {
		const now = Math.floor(Date.now() / 1000);
		const payload: JwtPayload = {
			sub: "alice",
			iss: "keycloak",
			aud: "https://daml.com/jwt/aud/participant/prod-participant",
			exp: now + 3600,
			"https://daml.com/ledger-api": {
				actAs: ["Alice::123"],
				readAs: [],
				admin: false,
			},
		};
		const info = describeCantonToken(payload);
		expect(info.format).toBe("audience-based");
		expect(info.userId).toBe("alice");
		expect(info.participantId).toBe("prod-participant");
		expect(info.idpId).toBe("keycloak");
		expect(info.actAs).toEqual(["Alice::123"]);
		expect(info.admin).toBe(false);
		expect(info.expiresInSec).toBeGreaterThan(3590);
	});

	test("returns null expiresInSec when no exp claim", () => {
		const info = describeCantonToken({ sub: "alice" });
		expect(info.expiresInSec).toBeNull();
	});

	test("returns negative expiresInSec for expired token", () => {
		const now = Math.floor(Date.now() / 1000);
		const info = describeCantonToken({ exp: now - 60 });
		expect(info.expiresInSec).toBeLessThan(0);
	});
});
