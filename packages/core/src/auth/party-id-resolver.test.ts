import { describe, test, expect } from "bun:test";
import { PartyIdResolver } from "./party-id-resolver.ts";
import { NexusAuthError } from "../types/index.ts";

function makeMockCanton(handlers: Record<string, unknown>) {
  return Bun.serve({
    port: 0,
    fetch(req) {
      const path = new URL(req.url).pathname;
      for (const [pattern, body] of Object.entries(handlers)) {
        if (path === pattern) {
          return Response.json(body);
        }
      }
      return new Response("Not Found", { status: 404 });
    },
  });
}

describe("PartyIdResolver", () => {
  test("resolves partyId from primaryParty field", async () => {
    const server = makeMockCanton({
      "/v2/users/alice": { primaryParty: "Alice::abc123", isDeactivated: false },
    });

    const resolver = new PartyIdResolver({
      baseUrl: `http://localhost:${server.port}`,
      getToken: async () => "test-token",
    });

    const partyId = await resolver.resolvePartyId("alice");
    server.stop();

    expect(partyId).toBe("Alice::abc123");
  });

  test("falls back to actAs rights when primaryParty is absent", async () => {
    const server = makeMockCanton({
      "/v2/users/alice": { isDeactivated: false }, // no primaryParty
      "/v2/users/alice/rights": { canActAs: ["Alice::fallback123"], canReadAs: [] },
    });

    const resolver = new PartyIdResolver({
      baseUrl: `http://localhost:${server.port}`,
      getToken: async () => "test-token",
    });

    const partyId = await resolver.resolvePartyId("alice");
    server.stop();

    expect(partyId).toBe("Alice::fallback123");
  });

  test("caches results and avoids duplicate requests", async () => {
    let callCount = 0;
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        if (new URL(req.url).pathname === "/v2/users/alice") {
          callCount++;
          return Response.json({ primaryParty: "Alice::cached" });
        }
        return new Response("Not Found", { status: 404 });
      },
    });

    const resolver = new PartyIdResolver({
      baseUrl: `http://localhost:${server.port}`,
      getToken: async () => "test-token",
      cacheTtlMs: 60_000,
    });

    await resolver.resolvePartyId("alice");
    await resolver.resolvePartyId("alice");
    await resolver.resolvePartyId("alice");

    server.stop();
    expect(callCount).toBe(1);
  });

  test("invalidate() clears the cache entry", async () => {
    let callCount = 0;
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        if (new URL(req.url).pathname === "/v2/users/alice") {
          callCount++;
          return Response.json({ primaryParty: "Alice::inv" });
        }
        return new Response("Not Found", { status: 404 });
      },
    });

    const resolver = new PartyIdResolver({
      baseUrl: `http://localhost:${server.port}`,
      getToken: async () => "test-token",
      cacheTtlMs: 60_000,
    });

    await resolver.resolvePartyId("alice");
    resolver.invalidate("alice");
    await resolver.resolvePartyId("alice");

    server.stop();
    expect(callCount).toBe(2);
  });

  test("throws NexusAuthError when no actAs parties found", async () => {
    const server = makeMockCanton({
      "/v2/users/nobody": { isDeactivated: false },
      "/v2/users/nobody/rights": { canActAs: [], canReadAs: [] },
    });

    const resolver = new PartyIdResolver({
      baseUrl: `http://localhost:${server.port}`,
      getToken: async () => "test-token",
    });

    await expect(resolver.resolvePartyId("nobody")).rejects.toBeInstanceOf(NexusAuthError);
    server.stop();
  });
});
