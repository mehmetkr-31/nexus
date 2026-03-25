import { describe, test, expect } from "bun:test";
import { SessionManager, generateEncryptionKey } from "./session-manager.ts";

const baseSession = {
  token: "test.jwt.token",
  partyId: "Alice::abc123",
  userId: "alice",
};

describe("SessionManager — unencrypted", () => {
  const mgr = new SessionManager({ secure: false });

  test("createSessionCookie() returns a valid Set-Cookie string", async () => {
    const cookie = await mgr.createSessionCookie(baseSession);
    expect(cookie).toContain("nexus_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
  });

  test("round-trips session through cookie", async () => {
    const cookieHeader = await mgr.createSessionCookie(baseSession);
    const name = cookieHeader.split("=")[0];
    const value = cookieHeader.split(";")[0]?.slice((name ?? "").length + 1);
    if (!value) throw new Error("No cookie value");

    const session = await mgr.getSession(`${name}=${value}`);
    expect(session).not.toBeNull();
    expect(session?.partyId).toBe("Alice::abc123");
    expect(session?.token).toBe("test.jwt.token");
  });

  test("getSession() returns null for missing cookie", async () => {
    const session = await mgr.getSession("other_cookie=xyz");
    expect(session).toBeNull();
  });

  test("getSession() returns null for null header", async () => {
    const session = await mgr.getSession(null);
    expect(session).toBeNull();
  });

  test("destroySessionCookie() sets expired date", () => {
    const cookie = mgr.destroySessionCookie();
    expect(cookie).toContain("nexus_session=");
    expect(cookie).toContain("1970");
  });
});

describe("SessionManager — encrypted (AES-GCM)", () => {
  const key = generateEncryptionKey();

  test("generateEncryptionKey() returns 64-char hex string", () => {
    expect(key).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(key)).toBe(true);
  });

  test("round-trips encrypted session", async () => {
    const mgr = new SessionManager({ secure: false, encryptionKey: key });
    const cookieHeader = await mgr.createSessionCookie(baseSession);

    const name = cookieHeader.split("=")[0]!;
    const value = cookieHeader.split(";")[0]?.slice(name.length + 1);
    if (!value) throw new Error("No cookie value");

    const session = await mgr.getSession(`${name}=${value}`);
    expect(session?.partyId).toBe("Alice::abc123");
    expect(session?.userId).toBe("alice");
  });

  test("tampered cookie returns null", async () => {
    const mgr = new SessionManager({ secure: false, encryptionKey: key });
    const session = await mgr.getSession("nexus_session=tampered_data_xyz");
    expect(session).toBeNull();
  });
});

describe("SessionManager — expiry", () => {
  test("expired session returns null", async () => {
    const mgr = new SessionManager({ secure: false, ttlMs: 1 });
    const cookieHeader = await mgr.createSessionCookie(baseSession);
    const name = cookieHeader.split("=")[0]!;
    const value = cookieHeader.split(";")[0]?.slice(name.length + 1);
    if (!value) throw new Error("No cookie value");

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 5));
    const session = await mgr.getSession(`${name}=${value}`);
    expect(session).toBeNull();
  });
});

describe("SessionManager — getSessionFromRequest", () => {
  test("extracts session from Request object", async () => {
    const mgr = new SessionManager({ secure: false });
    const cookieHeader = await mgr.createSessionCookie(baseSession);
    const name = cookieHeader.split("=")[0]!;
    const value = cookieHeader.split(";")[0]?.slice(name.length + 1);

    const req = new Request("http://localhost/", {
      headers: { cookie: `${name}=${value}` },
    });
    const session = await mgr.getSessionFromRequest(req);
    expect(session?.partyId).toBe("Alice::abc123");
  });
});
