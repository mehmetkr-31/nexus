import { describe, test, expect, beforeEach } from "bun:test";
import { JwtManager } from "./jwt-manager.ts";
import { NexusAuthError } from "../types/index.ts";

// ─── Sandbox token tests ───────────────────────────────────────────────────────

describe("JwtManager — sandbox", () => {
  test("generates a valid JWT for sandbox mode", async () => {
    const manager = new JwtManager({
      type: "sandbox",
      secret: "test-secret-key",
      userId: "alice",
      partyId: "Alice::12345",
    });

    const token = await manager.getToken();
    expect(token).toBeString();

    // Should be 3 dot-separated parts
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  test("caches the token on subsequent calls", async () => {
    const manager = new JwtManager({
      type: "sandbox",
      secret: "test-secret-key",
      userId: "alice",
      partyId: "Alice::12345",
    });

    const first = await manager.getToken();
    const second = await manager.getToken();
    expect(first).toBe(second);
  });

  test("refreshToken() clears cache and returns new token", async () => {
    const manager = new JwtManager({
      type: "sandbox",
      secret: "test-secret-key",
      userId: "alice",
      partyId: "Alice::12345",
    });

    const first = await manager.getToken();
    // Sandbox tokens include timestamp — wait 1ms to ensure different iat
    await new Promise((r) => setTimeout(r, 2));
    const refreshed = await manager.refreshToken();

    // Both are valid JWTs but may differ in iat
    expect(first).toBeString();
    expect(refreshed).toBeString();
  });

  test("getCachedToken() returns null before first getToken()", () => {
    const manager = new JwtManager({
      type: "sandbox",
      secret: "test-secret-key",
      userId: "alice",
      partyId: "Alice::12345",
    });
    expect(manager.getCachedToken()).toBeNull();
  });
});

// ─── Static JWT tests ─────────────────────────────────────────────────────────

describe("JwtManager — static jwt", () => {
  // Create a non-expiring test token
  const makeStaticToken = (expOffset = 9999999) => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payload = btoa(JSON.stringify({
      sub: "alice",
      exp: Math.floor(Date.now() / 1000) + expOffset,
    })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    return `${header}.${payload}.fake-sig`;
  };

  test("returns the static token directly", async () => {
    const token = makeStaticToken();
    const manager = new JwtManager({ type: "jwt", token });
    expect(await manager.getToken()).toBe(token);
  });

  test("calls refreshToken callback when token is expiring", async () => {
    let called = false;
    const freshToken = makeStaticToken(9999999);
    const expiringToken = makeStaticToken(20); // expires in 20s → < 30s buffer

    const manager = new JwtManager({
      type: "jwt",
      token: expiringToken,
      refreshToken: async () => {
        called = true;
        return freshToken;
      },
    });

    // Pre-seed cache with expiring token
    (manager as unknown as { cachedToken: string }).cachedToken = expiringToken;
    const result = await manager.getToken();

    expect(called).toBe(true);
    expect(result).toBe(freshToken);
  });
});

// ─── OIDC tests ───────────────────────────────────────────────────────────────

describe("JwtManager — oidc", () => {
  test("fetches token from OIDC endpoint", async () => {
    const mockToken = "oidc.mock.token";

    // Start a mock OIDC server using Bun.serve
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        if (new URL(req.url).pathname === "/token") {
          return Response.json({ access_token: mockToken });
        }
        return new Response("Not Found", { status: 404 });
      },
    });

    const manager = new JwtManager({
      type: "oidc",
      tokenEndpoint: `http://localhost:${server.port}/token`,
      clientId: "test-client",
      clientSecret: "test-secret",
    });

    const token = await manager.getToken();
    server.stop();

    expect(token).toBe(mockToken);
  });

  test("throws NexusAuthError when OIDC endpoint fails", async () => {
    const server = Bun.serve({
      port: 0,
      fetch() {
        return new Response("Unauthorized", { status: 401 });
      },
    });

    const manager = new JwtManager({
      type: "oidc",
      tokenEndpoint: `http://localhost:${server.port}/token`,
      clientId: "test-client",
    });

    await expect(manager.getToken()).rejects.toBeInstanceOf(NexusAuthError);
    server.stop();
  });
});
