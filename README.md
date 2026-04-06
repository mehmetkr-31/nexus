<div align="center">

# Nexus Framework

**Build Canton dApps like modern web apps.**

A type-safe, isomorphic TypeScript SDK that turns Daml smart contracts into a first-class React + Next.js developer experience — with automatic Package ID resolution, consensus-aware mutations, and zero-boilerplate authentication.

[Why Nexus](#why-nexus) · [Quick Start](#quick-start-60-seconds) · [Typed Namespaces](#typed-namespaces--the-killer-feature) · [Server-Side Rendering](#server-side-rendering) · [Plugins](#plugins)

</div>

---

## Table of Contents

- [Why Nexus?](#why-nexus)
- [Packages](#packages)
- [Installation](#installation)
- [Quick Start (60 seconds)](#quick-start-60-seconds)
- [Core Concepts](#core-concepts)
  - [The Three-Layer Architecture](#the-three-layer-architecture)
  - [Isomorphic by Design](#isomorphic-by-design)
- [Typed Namespaces — The Killer Feature](#typed-namespaces--the-killer-feature)
- [Authentication](#authentication)
  - [Sandbox Auth (local development)](#sandbox-auth-local-development)
  - [JWT Auth (static or refreshable)](#jwt-auth-static-or-refreshable)
  - [OIDC + JWKS (production)](#oidc--jwks-production)
  - [Sessions & Cookies](#sessions--cookies)
- [Reading the Ledger](#reading-the-ledger)
  - [TanStack Query Hooks](#tanstack-query-hooks)
  - [Query Key Factories](#query-key-factories)
  - [WebSocket Streaming](#websocket-streaming)
  - [PQS (Participant Query Store)](#pqs-participant-query-store)
- [Writing to the Ledger](#writing-to-the-ledger)
  - [Mutations with Consensus Finality](#mutations-with-consensus-finality)
  - [Canton Deduplication (Handled for You)](#canton-deduplication-handled-for-you)
- [Server-Side Rendering](#server-side-rendering)
  - [`createNexusServer` — The Unified Server Factory](#createnexusserver--the-unified-server-factory)
  - [Next.js Server Components — Prefetch → Hydrate](#nextjs-server-components--prefetch--hydrate)
  - [Server Actions](#server-actions)
  - [JWT Proxy Route Handler (B2B pattern)](#jwt-proxy-route-handler-b2b-pattern)
- [Plugins](#plugins)
  - [Built-in React plugins](#built-in-react-plugins)
  - [Writing a custom plugin](#writing-a-custom-plugin)
  - [Fetch middleware hooks](#fetch-middleware-hooks)
- [Error Handling](#error-handling)
- [CLI (`create-nexus-app`)](#cli-create-nexus-app)
- [Low-Level `CantonClient`](#low-level-cantonclient)
  - [Deduplication period (advanced)](#deduplication-period-advanced)
- [Configuration Reference](#configuration-reference)
- [Architecture Diagram](#architecture-diagram)
- [References](#references)

---

## Why Nexus?

Building a Canton frontend today means solving the same hard problems on every project — while fighting a legacy stack that's three React majors behind.

| Pain Point | What You Face Without Nexus | What Nexus Gives You |
|---|---|---|
| **React compatibility** | `@daml/react` pins projects to **React 16.12**. Upgrading to 18/19 triggers irreconcilable peer conflicts. | Full React 18 & 19 support. Concurrent Mode, Suspense, Server Components — all out of the box. |
| **WebSocket stability** | `useStreamQueries` has a documented memory leak. Connections pile up until the app crashes at ~500 open sockets. | Clean subscription lifecycle with `updateToken()` for seamless JWT rotation on long-lived streams. |
| **Package IDs** | Manual caching layers. Every team builds its own discovery mechanism. Package upgrades silently break queries. | `PackageResolver` parses DALF bytes automatically. Use short names (`"my-pkg:Iou:Iou"`) everywhere. |
| **Party ID resolution** | Multi-step flow: create party → map username → generate token. No built-in answer. | `client.auth.partyId.resolvePartyId("alice")` — one call, 5-minute cache. |
| **JWT lifecycle** | Rolling your own refresh, expiry, and error recovery. | `JwtManager` with 10-second grace period, deduplicated refresh, and transparent stream reconnection. |
| **Next.js SSR** | No established pattern for Server Components or Server Actions with Canton. | First-class Server Components, Server Actions, HTTP-only AES-256-GCM cookie sessions, prefetch + hydrate. |
| **TanStack Query integration** | Writing query keys by hand. Stale cache bugs. | `queryOptions` factories with a structured key hierarchy. Invalidate per-template or globally in one call. |
| **Consensus-aware UI** | Mutations resolve on HTTP 200, not on ledger finality → race conditions. | `transactionStatusQueryOptions` polls until the update is actually committed. |
| **Canton deduplication** | `DUPLICATE_COMMAND`, `SUBMISSION_ALREADY_IN_FLIGHT` — silent footguns. | Automatic handling: 409 → success, 425 → single retry with fresh submissionId. |
| **Type safety** | `any` leaks everywhere when you stitch Daml codegen to React state. | End-to-end inference: a `DamlChoice` object → a typed `mutate()` with no `templateId` or `choice` string to remember. |

**Nexus is not a wrapper.** It's the missing layer between the raw Canton JSON Ledger API and the modern web frontend stack — purely additive, Apache 2.0, and consumed through the same stable API as any other client.

---

## Packages

Nexus ships as a small set of focused packages. Pick what you need.

| Package | What it does | Use when |
|---|---|---|
| **[`@nexus-framework/core`](./framework/core)** | `CantonClient`, auth plugins (`sandboxAuth` / `jwtAuth` / `oidcAuth`), `SessionManager`, `PackageResolver`, `createNexusServer`. Pure TypeScript, no React. | Any backend, Bun, Node, edge runtimes, CLIs, or isomorphic libraries. |
| **[`@nexus-framework/react`](./framework/react)** | `createNexusClient`, TanStack Query hooks, WebSocket streaming, identity hooks, optimistic UI, Next.js SSR adapters. | React 18+/19 apps, Next.js 15+, TanStack Start. |
| **[`@nexus-framework/pqs`](./framework/pqs)** | Lightweight PQS client using `Bun.SQL` (no ORM). | Bun-native projects that want PQS reads without Kysely. |
| **[`@nexus/cli`](./framework/cli)** | `create-nexus-app` interactive scaffolder. | New projects. |

> **Note:** The core package *already* ships a Kysely-based PQS engine — you only need `@nexus-framework/pqs` if you want the lighter `Bun.SQL`-only client.

---

## Installation

Nexus works with any package manager. Pick yours:

```bash
# bun (fastest)
bun add @nexus-framework/core @nexus-framework/react @tanstack/react-query

# pnpm
pnpm add @nexus-framework/core @nexus-framework/react @tanstack/react-query

# npm
npm install @nexus-framework/core @nexus-framework/react @tanstack/react-query

# yarn
yarn add @nexus-framework/core @nexus-framework/react @tanstack/react-query
```

Scaffold a new project:

```bash
bunx create-nexus-app     # bun
pnpm dlx create-nexus-app # pnpm
npx  create-nexus-app     # npm
```

**Peer dependencies:** `react ^18 || ^19`, `@tanstack/react-query ^5`, and Canton JSON Ledger API 2.x/3.x.

---

## Quick Start (60 seconds)

> Goal: Query and create IOUs on Canton Sandbox from a Next.js App Router page.

### 1. Generate Daml TypeScript bindings

Use `daml codegen js` — Nexus consumes the standard codegen output directly. No plugins, no post-processing.

```bash
daml codegen js -o ./daml.js .daml/dist/my-package-0.0.1.dar
```

### 2. Create your server instance (`lib/nexus-server.ts`)

```ts
import { Iou } from "@daml.js/my-package";
import { SessionManager, sandboxAuth } from "@nexus-framework/core";
import { createNexusServer } from "@nexus-framework/core/server";

export const sessionManager = new SessionManager({
  encryptionKey: process.env.SESSION_SECRET, // 32-byte hex — see generateEncryptionKey()
});

// One call. Three access patterns. Full type inference from your Daml types.
export const nexus = await createNexusServer({
  ledgerApiUrl: process.env.CANTON_API_URL ?? "http://localhost:7575",
  pqsUrl:       process.env.PQS_URL,          // optional: SQL reads via Kysely + RLS
  auth:         sandboxAuth({ userId: "alice", secret: "secret" }),
  types:        { Iou: Iou.Iou },             // becomes `nexus.forParty(...).Iou.*`
  sessionManager,
});
```

### 3. Create your React client (`lib/nexus.ts`)

```ts
"use client";
import { Iou } from "@daml.js/my-package";
import { sandboxAuth } from "@nexus-framework/core";
import {
  createNexusClient,
  tanstackQueryPlugin,
  identityPlugin,
  streamingPlugin,
} from "@nexus-framework/react";

// The `types` option unlocks typed namespaces → `nexus.Iou.useContracts()` with no templateId
export const nexus = await createNexusClient({
  baseUrl: "/api/ledger",                     // proxied through createLedgerRouteHandler
  types: { Iou: Iou.Iou },
  plugins: [
    sandboxAuth({ userId: "alice", secret: "secret" }),
    tanstackQueryPlugin(),
    streamingPlugin(),
    identityPlugin(),
  ],
});
```

### 4. Use it — Server Component with prefetch

```tsx
// app/ious/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { nexus } from "@/lib/nexus-server";
import { IouList } from "@/components/IouList";

export default async function IouPage() {
  const partyId = await nexus.client.auth.partyId.resolvePartyId("alice");

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(
    nexus.client.query.contracts({ templateId: "my-package:Iou:Iou", parties: [partyId] }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IouList partyId={partyId} />
    </HydrationBoundary>
  );
}
```

### 5. Client component — typed namespace + consensus-aware mutation

```tsx
// components/IouList.tsx
"use client";
import { Iou } from "@daml.js/my-package";
import { nexus } from "@/lib/nexus";

export function IouList({ partyId }: { partyId: string }) {
  // Typed namespace: no templateId, full payload inference
  const { contracts, isLoading } = nexus.Iou.useContracts({ parties: [partyId] });

  // Pass the Daml Choice object → TypeScript infers the argument shape
  const transfer = nexus.Iou.useExercise(Iou.Iou.Transfer);

  if (isLoading) return <Spinner />;

  return contracts.map((c) => (
    <IouCard
      key={c.contractId}
      owner={c.payload.owner}
      amount={c.payload.amount}
      onTransfer={(newOwner) =>
        transfer.mutate({
          contractId: c.contractId,
          choiceArgument: { newOwner }, // ← typed!
          actAs: [partyId],
        })
      }
    />
  ));
}
```

**That's it.** No context providers, no manual query keys, no template ID strings to copy-paste, no `as any` leaks. Type inference flows from Daml codegen all the way to your JSX.

---

## Core Concepts

### The Three-Layer Architecture

```
┌─ React layer ──────────────┐   Hooks, typed namespaces, SSR adapters
│  @nexus-framework/react    │   (createNexusClient + plugins)
└──────────┬─────────────────┘
           │
┌─ Transport + Auth ─────────┐   CantonClient, JwtManager, SessionManager,
│  @nexus-framework/core     │   PackageResolver, plugin system
└──────────┬─────────────────┘
           │
┌─ Canton ───────────────────┐   JSON Ledger API (HTTP + WebSocket) · PQS (Postgres)
└────────────────────────────┘
```

Every higher-level abstraction is built on the `CantonClient` — a single `fetch`-based HTTP adapter with middleware hooks. You can drop down to it whenever you want.

### Isomorphic by Design

Nexus runs the **same code** on:

- **Node.js / Bun** — Next.js App Router, Server Actions, API routes, Server Components
- **Browsers** — React Client Components, Vite apps, Electron
- **Edge runtimes** — Workers, Vercel Edge, Cloudflare

Uses Web Crypto (`crypto.subtle`), `fetch`, and `WebSocket` — no Node-only dependencies, no `dotenv`, no polyfills.

---

## Typed Namespaces — The Killer Feature

Passing `templateId: "my-pkg:Iou:Iou"` everywhere is fragile, ugly, and loses type safety. Nexus solves this with **typed namespaces**.

When you provide `types` to `createNexusClient` or `createNexusServer`, every key becomes a fully-typed accessor with `templateId` baked in.

### Before (generic hooks)

```tsx
const { contracts } = nexus.useContracts<IouPayload>({
  templateId: "my-package:Iou:Iou",  // ← string, typo-prone, wrong payload type is not caught
  parties: [partyId],
});
```

### After (typed namespace)

```tsx
const { contracts } = nexus.Iou.useContracts({ parties: [partyId] });
//      └┬┘           └────────────┬────────────────────────────┘
//       │                         │
//       └── your key in `types`   └── `contracts[0].payload` is typed as Iou.Iou — no generics needed
```

### The `useExercise(DamlChoice)` pattern

Pass the **Daml Choice object** from codegen — Nexus infers the argument type from the `DamlChoice<_, Arg, _>` generic.

```tsx
import { Iou } from "@daml.js/my-package";

// TArg inferred from Iou.Iou.Transfer → { newOwner: string }
const transfer = nexus.Iou.useExercise(Iou.Iou.Transfer);

transfer.mutate({
  contractId,
  choiceArgument: { newOwner: "Bob::122059..." }, // ✅ typed
  actAs: [alicePartyId],
});

// String-based choice still works for the catch-all:
const archive = nexus.Iou.useExercise("Archive");
archive.mutate({ contractId, choiceArgument: {}, actAs: [alicePartyId] });
```

### Full namespace surface

Every template gets the same set of factories and hooks:

```ts
nexus.Iou.query.contracts({ parties })           // queryOptions factory
nexus.Iou.query.pagedContracts({ parties, pageSize: 50 })
nexus.Iou.query.contractById({ contractId, parties })
nexus.Iou.query.contractByKey({ key: { owner: partyId }, parties })

nexus.Iou.useCreateContract({ onSuccess })        // typed create mutation
nexus.Iou.useExercise(Iou.Iou.Transfer)           // typed exercise mutation
nexus.Iou.useExerciseChoice()                     // generic exercise (rarely needed)
```

**Use the `query.*` factories with `useQuery` / `useSuspenseQuery` / `useInfiniteQuery` directly** — that's the modern TanStack Query v5 pattern and plays nicely with SSR hydration.

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";

const { data } = useSuspenseQuery(nexus.Iou.query.contracts({ parties: [partyId] }));
```

---

## Authentication

All three auth strategies implement the same `NexusPlugin` interface and share:

- **Deduplicated refresh** — concurrent `getToken()` calls during a refresh share one promise
- **10-second grace period** before expiry triggers an auto-refresh
- **Dispatcher hook** — any plugin that holds a long-lived connection (e.g. WebSocket streams) is notified when the token rotates, so it can call `updateToken()` transparently

### Sandbox Auth (local development)

Self-signed HMAC-256 JWTs for Canton Sandbox dev mode. **Not for production.**

```ts
import { sandboxAuth, provisionSandboxUser } from "@nexus-framework/core";

// Optional: provision the user first (idempotent — safe to run every boot)
const partyId = await provisionSandboxUser({
  ledgerApiUrl: "http://localhost:7575",
  userId: "alice",
  secret: "secret",
});
// → "Alice::122059a10c67ef1bb..."

// Use it
sandboxAuth({
  userId: "alice",
  secret: "secret",
  partyId, // optional — resolved automatically via PartyIdResolver otherwise
})
```

`provisionSandboxUser` runs the full Canton flow for you:
1. Allocate a party (retries on sandbox startup)
2. Create a ledger user with that party as primary
3. Grant `canActAs` and `canReadAs` rights

### JWT Auth (static or refreshable)

For CI, testing, or when your auth flow is external:

```ts
import { jwtAuth } from "@nexus-framework/core";

// Static token
jwtAuth({ token: process.env.CANTON_TOKEN! })

// Auto-refreshing token — called 10 seconds before expiry
jwtAuth({
  token: initialToken,
  refreshToken: async () => {
    const res = await fetch("/api/refresh", { method: "POST" });
    return (await res.json()).token;
  },
})
```

### OIDC + JWKS (production)

Full OIDC Client Credentials flow with optional JWKS verification — matches Canton's `IdentityProviderConfig` setup.

```ts
import { oidcAuth } from "@nexus-framework/core";

oidcAuth({
  tokenEndpoint: "https://keycloak.example.com/realms/canton/protocol/openid-connect/token",
  clientId: "canton-app",
  clientSecret: process.env.OIDC_SECRET,
  scopes: ["daml_ledger_api", "offline_access"],

  // Production: verify every fetched token against the provider's JWKS
  jwksUri: "https://keycloak.example.com/realms/canton/.well-known/jwks.json",
  issuer:  "https://keycloak.example.com/realms/canton",
  audience: "https://daml.com/jwt/aud/participant/sandbox-participant",
  jwksCacheTtlMs: 5 * 60 * 1000, // default
})
```

When `jwksUri` is set, Nexus uses `crypto.subtle.verify` to validate the signature, issuer, and audience of every token *before* it's used — exactly what Canton's participant node does server-side.

### Sessions & Cookies

`SessionManager` persists the `{ token, partyId, userId?, expiresAt }` tuple as an **encrypted HttpOnly cookie** using AES-256-GCM. Compatible with any runtime that supports Web Crypto.

```ts
import { SessionManager, generateEncryptionKey } from "@nexus-framework/core";

// Run once, store the output in your secret manager
const key = generateEncryptionKey(); // 64-char hex string

const sessionManager = new SessionManager({
  encryptionKey: key,
  ttlMs:   60 * 60 * 1000,          // 1 hour (default)
  cookieName: "nexus_session",       // default
  secure:  process.env.NODE_ENV === "production",
  domain:  ".example.com",
  path:    "/",
});

// After login: set the cookie
const setCookie = await sessionManager.createSessionCookie({ partyId, token });
response.headers.set("Set-Cookie", setCookie);

// In any route handler or server action:
const session = await sessionManager.getSessionFromRequest(req); // null if missing/expired
const session = await sessionManager.requireSession(req);        // throws NexusAuthError

// Logout
response.headers.set("Set-Cookie", sessionManager.destroySessionCookie());
```

> If `encryptionKey` is omitted, payloads are base64-encoded (not encrypted). Never do this in production.

---

## Reading the Ledger

### TanStack Query Hooks

All hooks below work with generic IDs or typed namespaces. Examples use the namespace form.

```tsx
// Single-page active contracts
const { contracts, isLoading } = nexus.Iou.useContracts({ parties });

// Fetch all pages (use sparingly)
const { contracts } = nexus.Iou.useContracts({ parties, fetchAll: true });

// Suspense variant — throws → boundary, no loading state to handle
const { contracts } = useSuspenseQuery(nexus.Iou.query.contracts({ parties }));

// Cursor-based infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
  nexus.Iou.query.pagedContracts({ parties, pageSize: 50 }),
);

// Single contract by ID (O(1) native Canton lookup — no ACS scan)
const { data: iou } = useQuery(nexus.Iou.query.contractById({ contractId, parties }));

// Single contract by Daml key (O(1))
const { data: account } = useQuery(
  nexus.Account.query.contractByKey({ key: { owner: partyId }, parties }),
);

// Interface views
const { interfaces } = nexus.useInterface<TransferView>({
  interfaceId: "my-pkg:Iou:Transferable",
  parties,
});
```

### Query Key Factories

All keys live under `["nexus", ...]` and can be invalidated with one call.

```ts
import { nexusKeys, invalidateContractQueries, invalidateAllNexusQueries } from "@nexus-framework/react";

// After a successful mutation — invalidate everything for these templates
await invalidateContractQueries(queryClient, ["my-pkg:Iou:Iou", "my-pkg:Iou:IouTransfer"]);

// Nuclear option (logout, party switch)
await invalidateAllNexusQueries(queryClient);

// Fine-grained
queryClient.invalidateQueries({ queryKey: nexusKeys.contractsByTemplate("my-pkg:Iou:Iou") });
queryClient.invalidateQueries({ queryKey: nexusKeys.partyId("alice") });
```

The key hierarchy:

```ts
["nexus"]
["nexus", "contracts"]
["nexus", "contracts", templateId]
["nexus", "contracts", templateId, { parties, filter }]
["nexus", "contracts", templateId, "id",  contractId, { parties }]
["nexus", "contracts", templateId, "key", key,        { parties }]
["nexus", "interfaces", interfaceId, { parties }]
["nexus", "ledger-end"]
["nexus", "synchronizers"]
["nexus", "party", userId]
["nexus", "transaction", transactionId]
```

### WebSocket Streaming

Real-time ACS updates via Canton's native WebSocket API, with automatic JWT subprotocol auth.

```tsx
// Single template
const { contracts, isLive, connected, error, close, updateToken } =
  nexus.useStreamContracts<IouPayload>({
    templateId: "my-pkg:Iou:Iou",
    parties: [partyId],
    onLive: () => console.log("Caught up to ledger end"),
  });

// Multiple templates simultaneously
const state = nexus.useMultiStream({
  mapping: {
    ious:     { templateId: "my-pkg:Iou:Iou",         parties: [partyId] },
    transfers:{ templateId: "my-pkg:Iou:IouTransfer", parties: [partyId] },
  },
  onAllLive: () => console.log("All streams live"),
});
// state.ious, state.transfers, state.isLive, state.connected, state.close()
```

**Token rotation is transparent.** When the JWT refreshes, the streaming plugin reconnects the WebSocket with the new token — no state loss, no dropped events.

### PQS (Participant Query Store)

PQS is Canton's Postgres read replica — the right tool for complex filtering, sorting, and pagination. Nexus speaks it through Kysely with automatic Row Level Security.

Enable it by passing `pqsUrl` to `createNexusServer`:

```ts
const nexus = await createNexusServer({
  ledgerApiUrl: "http://localhost:7575",
  pqsUrl: "postgres://pqs:pqs@localhost:5432/pqs",
  auth:   sandboxAuth({ userId, secret }),
  types:  { Iou: Iou.Iou },
});

const ctx = nexus.forParty(partyId);

// SQL-backed queries — O(log N)
const ious = await ctx.Iou.findMany({
  where:   { currency: "USD" },
  orderBy: { amount: "desc" },
  limit:   50,
});

const iou = await ctx.Iou.findById("00abc...");
```

**How RLS works:** Every query opens a transaction, runs `SET LOCAL app.current_user = '<partyId>'`, then runs the user query. This matches the Canton PQS RLS policy convention — Postgres enforces party-level visibility even if your code has a bug.

If `pqsUrl` is **not** set, `findMany()` throws a clear error and `findById()` falls back to the Canton HTTP `POST /v2/contracts/contract-by-id` endpoint.

---

## Writing to the Ledger

### Mutations with Consensus Finality

```tsx
const create = nexus.Iou.useCreateContract({
  onSuccess: (result) => invalidateContractQueries(queryClient, ["my-pkg:Iou:Iou"]),
});

create.mutate({
  createArguments: { owner: partyId, amount: "100", currency: "USD" },
  actAs: [partyId],
});
```

To wait for actual **ledger finality** (not just HTTP 200), track the returned `transactionId`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { transactionStatusQueryOptions } from "@nexus-framework/react";

const [txId, setTxId] = useState<string>();

const create = nexus.Iou.useCreateContract({
  onSuccess: (r) => setTxId(r.updateId),
});

const { data: status } = useQuery({
  ...transactionStatusQueryOptions({ client: nexus, transactionId: txId ?? "" }),
  enabled: !!txId,
});
// status: "pending" | "finalized" | "failed"
```

### Canton Deduplication (Handled for You)

Canton's command submission has two failure modes that trip up every new team. Nexus handles both automatically:

| Error | What it means | Nexus behavior |
|---|---|---|
| `DUPLICATE_COMMAND` (HTTP 409) | Canton already accepted this `commandId` | **Returns success** with the original `updateId` from the error details |
| `SUBMISSION_ALREADY_IN_FLIGHT` (HTTP 425) | Participant is still processing a previous attempt of the same `(commandId, submissionId)` | **Single retry** after 500 ms with a fresh `submissionId` — same `commandId`, same ledger change |

The internal `buildCommandBody` separates the two identifiers correctly:

- **`commandId`** — stable across retries. Identifies the *intended ledger change*.
- **`submissionId`** — fresh on every attempt. Identifies *this specific HTTP call*.

If you don't pass them, Nexus generates UUIDs. For critical flows, pass a stable `commandId` yourself so retries across process restarts still deduplicate correctly.

---

## Server-Side Rendering

### `createNexusServer` — The Unified Server Factory

One config call gives you three access patterns:

```ts
const nexus = await createNexusServer({ ledgerApiUrl, pqsUrl, auth, types, sessionManager });
```

| Access pattern | What you get | When to use |
|---|---|---|
| **`nexus.client`** | A full `NexusClient` with typed `query.*` factories and `auth.partyId.resolvePartyId`. | TanStack prefetch, ledger end/synchronizer info, any HTTP-only operation. |
| **`nexus.forParty(partyId, token?)`** | Party-scoped proxy: `{ Iou: { findMany, findById, create, exercise, archive } }`. Reads use PQS (if configured) or Canton HTTP; writes always use Canton HTTP. | Server-side business logic when you already know the party. |
| **`nexus.forRequest(req)`** | Same as `forParty` but extracts `partyId` + `token` from the session cookie. Throws `NexusAuthError` on missing/expired sessions. | Server Actions, Hono routes, TanStack Start loaders. |

### Next.js Server Components — Prefetch → Hydrate

```tsx
// app/ious/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { nexus } from "@/lib/nexus-server";

export const dynamic = "force-dynamic";

export default async function IouPage() {
  const partyId = await nexus.client.auth.partyId.resolvePartyId("alice");

  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5_000, retry: 2 } },
  });

  await queryClient.prefetchQuery(
    nexus.client.query.contracts({ templateId: "my-pkg:Iou:Iou", parties: [partyId] }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IouList partyId={partyId} />
    </HydrationBoundary>
  );
}
```

The key insight: **the server and client use the same query key** (generated by `contractQueryOptions`), so after hydration the client reads straight from cache — no refetch, no flash.

### Server Actions

Three equivalent patterns, choose based on your taste:

```ts
// app/actions.ts
"use server";
import { nexus } from "@/lib/nexus-server";
import { withLedgerAction } from "@nexus-framework/react/server";

// Pattern A: nexus.forRequest + typed namespace (recommended)
export async function createIou(req: Request, amount: string) {
  const ctx = await nexus.forRequest(req);
  return ctx.Iou.create({ owner: "self", amount, currency: "USD" });
}

// Pattern B: nexus.forParty with explicit party
export async function createIouFor(partyId: string, amount: string) {
  const ctx = nexus.forParty(partyId);
  return ctx.Iou.create({ owner: partyId, amount, currency: "USD" });
}

// Pattern C: withLedgerAction — wraps in serializable { success, error } result
export async function transferIou(req: Request, contractId: string, newOwner: string) {
  const ctx = await nexus.forRequest(req);
  return withLedgerAction(nexus.client, async () => {
    return ctx.Iou.exercise(contractId, "Transfer", { newOwner });
  });
  // → { success: true, data } | { success: false, error: string, code?: string }
}
```

### JWT Proxy Route Handler (B2B pattern)

Keep JWTs **server-side only** by proxying Canton calls through a Next.js route handler. The browser never sees the token.

```ts
// app/api/ledger/[...path]/route.ts
import { createLedgerRouteHandler } from "@nexus-framework/react/server";
import { sessionManager } from "@/lib/nexus-server";

const handler = createLedgerRouteHandler({
  ledgerApiUrl: process.env.CANTON_API_URL!,
  mountPath: "/api/ledger",
  sessionManager,                                    // shared instance
  allowedPaths: ["/v2/state/", "/v2/commands/"],     // optional allowlist
});

export const GET = handler;
export const POST = handler;
```

Now point your React client at `/api/ledger` instead of the Canton URL:

```ts
createNexusClient({ baseUrl: "/api/ledger", ... })
```

The handler:
1. Requires a valid session cookie (`sessionManager.requireSession`)
2. Strips the mount path, validates against the allowlist
3. Injects the JWT from the session into the `Authorization` header
4. Streams the Canton response straight back (body + status + safe headers)

No JWT in `localStorage`, no CORS config, no exposed Canton URL.

---

## Plugins

Everything in Nexus is a plugin. You can build your own and they'll compose the same way.

### Built-in React plugins

```ts
createNexusClient({
  plugins: [
    // Auth (pick one)
    sandboxAuth({ ... }),
    jwtAuth({ ... }),
    oidcAuth({ ... }),

    // Hooks
    tanstackQueryPlugin(),       // useContracts, useCreateContract, useExerciseChoice, useCommandStatus, ...
    streamingPlugin(),           // useStreamContracts, useMultiStream
    identityPlugin(),            // useUser, useParties, useAuthStatus
    optimisticUiPlugin({ ... }), // declarative optimistic updates

    // Middleware
    fetchMiddlewarePlugin({ onRequest, onResponse, onError }),
    packageDiscoveryPlugin(),    // pre-warms the PackageResolver on startup
  ],
});
```

### Writing a custom plugin

Plugins contribute typed context to the client. The `NexusPlugin<TContext>` generic flows through inference.

```ts
import type { NexusPlugin } from "@nexus-framework/core";

interface AuditContext {
  audit: { log: (event: string, meta?: Record<string, unknown>) => void };
}

export const auditPlugin: NexusPlugin<AuditContext> = {
  id: "audit",
  init: async (client) => ({
    audit: {
      log: (event, meta) =>
        console.log(`[audit ${new Date().toISOString()}] ${event}`, meta ?? {}),
    },
  }),

  // Optional: intercept HTTP traffic
  middleware: {
    onRequest: (config) => {
      console.log(`→ ${config.method} ${config.path}`);
      return config;
    },
    onError: (err, config) => {
      console.error(`✗ ${config.method} ${config.path}`, err.statusCode, err.details);
    },
  },
};

// Usage — `nexus.audit` is fully typed
const nexus = await createNexus({ plugins: [sandboxAuth({ ... }), auditPlugin] });
nexus.audit.log("user.login", { userId: "alice" });
```

### Fetch middleware hooks

| Hook | When it fires | Typical use |
|---|---|---|
| `onRequest(config)` | Before every `fetch` | Add tracing headers, mutate body, log outgoing calls |
| `onResponse(res, config)` | After a successful `fetch` | Metrics, traces |
| `onAfterResponse(json, config)` | After JSON decode, **before** Zod validation | Transform / patch raw Canton responses |
| `onError(err, config)` | On network or HTTP error | Sentry, structured error logs, retries |

---

## Error Handling

Three error classes, all extending `NexusError`:

```ts
import { NexusError, NexusLedgerError, NexusAuthError } from "@nexus-framework/core";

try {
  await ctx.Iou.create({ owner: partyId, amount: "100", currency: "USD" });
} catch (err) {
  if (err instanceof NexusLedgerError) {
    // Canton rejected the command
    console.error(err.statusCode, err.details);
  } else if (err instanceof NexusAuthError) {
    // Session missing, expired, or failed to decrypt
    redirect("/login");
  } else {
    throw err;
  }
}
```

| Class | `statusCode` | `details` | Thrown when |
|---|---|---|---|
| `NexusLedgerError` | HTTP code (400, 404, 409, 425, 500, …) | Parsed Canton error body | The Canton API rejects a request |
| `NexusAuthError` | — | — | No valid session, token verification fails, decryption fails |
| `NexusError` | optional | optional | Base class — you usually catch the subclasses |

---

## CLI (`create-nexus-app`)

Scaffold a production-ready Next.js app pre-wired with Nexus:

```bash
bunx create-nexus-app my-dapp      # or: pnpm dlx, npx, yarn dlx
```

Interactive prompts:

- **Framework** — Next.js App Router (Vite template in progress)
- **Auth** — Canton Sandbox (local) or JWT / Better Auth (production)

You get:

- `lib/nexus-server.ts` — pre-configured `createNexusServer` with `SessionManager`
- `lib/nexus.ts` — `createNexusClient` with TanStack Query, streaming, and identity plugins
- `app/api/ledger/[...path]/route.ts` — JWT proxy handler
- Example Server Component with prefetch + hydration
- Example Server Action using `withLedgerAction`
- `.env.example` with every variable you need

---

## Low-Level `CantonClient`

When you need to escape the hatch — direct access to the Canton JSON Ledger API with all the middleware and error handling still in place:

```ts
import { CantonClient } from "@nexus-framework/core";

const http = new CantonClient({
  baseUrl: "http://localhost:7575",
  apiPathPrefix: "/v2",                   // default
  getToken: () => myCustomAuthFlow(),
  timeoutMs: 30_000,                      // default
  middlewares: [loggingMiddleware],
});

// State
await http.getLedgerEnd();                // { offset: string }
await http.getConnectedSynchronizers();

// Contracts (O(1) native endpoints)
await http.getContractById(contractId, { parties });
await http.getContractByKey("my-pkg:Iou:Iou", { owner: partyId }, { parties });
await http.queryContracts("my-pkg:Iou:Iou", { parties });
await http.queryByInterface("my-pkg:Iou:Transferable", { parties });

// Commands
await http.submitAndWait({ commands: [...], actAs: [partyId] });
await http.submitAndWaitForTransaction({ commands: [...], actAs: [partyId] });

// Packages (used internally by PackageResolver)
await http.listPackages();
await http.getPackageBytes(packageId);

// Finality (polls /v2/updates)
await http.waitForTransaction(transactionId, { timeoutMs: 30_000, signal });

// Streaming
await http.streamActiveContracts(templateId, handlers, { parties });
await http.streamCompletions(parties, fromOffset, handlers);
```

### Deduplication period (advanced)

For high-stakes commands, set an explicit `deduplicationPeriod` so you're not at the mercy of the participant's default:

```ts
await http.submitAndWait({
  commands: [{ type: "create", templateId, createArguments }],
  actAs: [partyId],
  commandId: "stable-uuid-for-this-logical-change",
  deduplicationPeriod: {
    DeduplicationDuration: { value: { seconds: 60 } },
  },
});
```

Three variants:

```ts
{ DeduplicationDuration: { value: { seconds: 60, nanos?: 0 } } }  // time window
{ DeduplicationOffset:   { value: ledgerOffset } }                 // clock-skew safe
{ Empty: {} }                                                      // participant default
```

---

## Configuration Reference

### `createNexusServer(options)`

| Option | Type | Required | Description |
|---|---|---|---|
| `ledgerApiUrl` | `string` | ✓ | Canton JSON Ledger API base URL |
| `auth` | `NexusPlugin` | ✓ | `sandboxAuth()`, `jwtAuth()`, or `oidcAuth()` |
| `types` | `Record<string, DamlTemplate>` | ✓ | Daml codegen templates → keys become `forParty().*` accessor names |
| `pqsUrl` | `string` | — | Postgres connection string. Enables `findMany()` and `findById()` SQL reads with RLS. |
| `sessionManager` | `SessionManager` | — | Required for `nexus.forRequest(req)` |
| `plugins` | `NexusPlugin[]` | — | Extra plugins (`fetchMiddlewarePlugin`, `packageDiscoveryPlugin`, custom…) |
| `timeoutMs` | `number` | — | HTTP timeout (default: `30_000`) |
| `apiPathPrefix` | `string` | — | API path prefix (default: `"/v2"`) |

### `createNexusClient(options)`

| Option | Type | Required | Description |
|---|---|---|---|
| `baseUrl` | `string` | ✓ | Canton API URL or your proxy path (e.g. `/api/ledger`) |
| `plugins` | `AnyPlugin[]` | ✓ | Mix of `NexusPlugin` (auth, middleware) and `NexusClientPlugin` (React hooks) |
| `types` | `Record<string, DamlTemplate>` | — | Enables typed namespaces (`nexus.Iou.useContracts()`) |
| `timeoutMs` | `number` | — | HTTP timeout (default: `30_000`) |
| `apiPathPrefix` | `string` | — | API path prefix (default: `"/v2"`) |

### `SessionManager(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `encryptionKey` | `string` | — | 64-char hex (AES-256-GCM key). Use `generateEncryptionKey()` to create. |
| `cookieName` | `string` | `"nexus_session"` | Cookie name |
| `ttlMs` | `number` | `3_600_000` | Session lifetime (1 hour) |
| `secure` | `boolean` | auto (prod) | Sets `Secure` flag |
| `domain` | `string` | — | Cookie domain |
| `path` | `string` | `"/"` | Cookie path |

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph App["🖥️  Your Application"]
        direction LR
        SC["Server Component / Action<br/><code>nexus.client.query.*</code><br/><code>nexus.forParty(p)</code><br/><code>nexus.forRequest(req)</code>"]
        CC["Client Component<br/><code>nexus.Iou.useContracts()</code><br/><code>nexus.Iou.useExercise(Transfer)</code><br/><code>nexus.useStreamContracts()</code>"]
    end

    subgraph React["📦  @nexus-framework/react"]
        direction LR
        TQ["tanstackQueryPlugin<br/>Hooks + queryOptions"]
        ST["streamingPlugin<br/>WebSocket state"]
        ID["identityPlugin<br/>useUser / useParties"]
        OP["optimisticUiPlugin<br/>Declarative updates"]
    end

    subgraph Core["🧠  @nexus-framework/core"]
        direction TB
        subgraph Transport["Transport Layer"]
            CantonClient["CantonClient<br/>HTTP + WebSocket + Middleware"]
            PR["PackageResolver<br/>DALF parser + cache"]
        end
        subgraph Auth["Auth Layer"]
            AP["Auth Plugins<br/>sandbox · jwt · oidc + JWKS"]
            JM["JwtManager<br/>refresh + grace + dispatcher"]
            SM["SessionManager<br/>AES-256-GCM cookies"]
        end
        subgraph Data["Data Layer"]
            Kysely["KyselyPqsEngine<br/>SQL reads + RLS"]
        end
    end

    subgraph Canton["⛓️  Canton Network"]
        direction LR
        API["Canton JSON Ledger API<br/>HTTP + WebSocket (v2)"]
        PQS[("Canton PQS<br/>PostgreSQL replica")]
    end

    SC --> React
    CC --> React
    React --> Core
    Transport --> API
    Data --> PQS
    Auth -.token.-> Transport

    classDef app fill:#e1f5ff,stroke:#0369a1,stroke-width:2px,color:#000
    classDef react fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#000
    classDef core fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000
    classDef canton fill:#fce7f3,stroke:#be185d,stroke-width:2px,color:#000
    class App app
    class React react
    class Core,Transport,Auth,Data core
    class Canton canton
```

### Request Flow — Create an IOU

```mermaid
sequenceDiagram
    autonumber
    participant UI as Client Component
    participant Hook as nexus.Iou.useCreateContract
    participant Client as NexusClient
    participant Middleware as Fetch Middleware
    participant Canton as Canton API
    participant TQ as TanStack Query Cache

    UI->>Hook: mutate({ createArguments, actAs })
    Hook->>Client: submitAndWait(commands)
    Client->>Client: JwtManager.getToken() (refresh if < 10s)
    Client->>Client: PackageResolver.resolve("my-pkg:Iou:Iou")
    Client->>Middleware: onRequest(config)
    Middleware->>Canton: POST /v2/commands/submit-and-wait
    Canton-->>Middleware: { updateId, completionOffset }
    Middleware->>Client: onResponse / onAfterResponse
    Client-->>Hook: SubmitResult
    Hook->>TQ: invalidateQueries(nexusKeys.contractsByTemplate)
    TQ-->>UI: Re-render with fresh contracts
```

### Consensus-Aware Mutation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Submitting: mutate()
    Submitting --> HttpAccepted: POST /submit-and-wait → 200
    Submitting --> DuplicateCommand: 409 DUPLICATE_COMMAND
    Submitting --> InFlight: 425 SUBMISSION_ALREADY_IN_FLIGHT
    Submitting --> Failed: 4xx / 5xx

    DuplicateCommand --> HttpAccepted: return original updateId
    InFlight --> Submitting: retry w/ fresh submissionId (500ms)

    HttpAccepted --> Pending: transactionStatusQueryOptions
    Pending --> Pending: poll /v2/updates
    Pending --> Finalized: transactionId found
    Pending --> Failed: timeout

    Finalized --> [*]: onSuccess
    Failed --> [*]: onError
```

---

## References

**Canton Network & Daml**

- [Canton Network](https://www.canton.network/)
- [Daml Ledger API](https://docs.daml.com/app-dev/ledger-api.html)
- [Canton JSON Ledger API v2](https://docs.digitalasset.com/build/3.4/reference/json-api)
- [Canton Participant Query Store (PQS)](https://docs.digitalasset.com/build/3.4/sdlc-howtos/canton/participant-query-store)
- [Daml codegen (TypeScript)](https://docs.daml.com/app-dev/bindings-ts/index.html)

**Ecosystem Integration**

- [TanStack Query v5](https://tanstack.com/query/latest)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Kysely (SQL query builder)](https://kysely.dev/)
- [Better Auth](https://www.better-auth.com/)

**Community Evidence** (the pain points Nexus solves)

- [Canton Network Developer Experience & Tooling Survey 2026](https://forum.canton.network/t/canton-network-developer-experience-and-tooling-survey-analysis-2026/8412)
- [Required JWT authorization for `filters_by_party`](https://forum.canton.network/t/required-jwt-authorization-for-filters_by_party-of-active-contracts/8371)
- [JWT auth questions](https://forum.canton.network/t/jwt-auth-questions/2525)
- [React hook WebSockets failing on unmount](https://forum.canton.network/t/react-hook-websockets-failing-on-unmount-preventing-future-reconnects/4186)
- [`@daml/react` WebSocket memory leak](https://forum.canton.network/t/can-i-explicitly-release-websocket-connections-used-in-the-daml-react-bindings/5297)
- [`create-daml-app` React 16 lock-in](https://forum.canton.network/t/cannot-find-module-react-or-its-corresponding-type-declarations/2930)
- [`create-daml-app` npm vulnerabilities](https://forum.canton.network/t/error-while-loading-create-damp-app-on-firefox-npm-vulnerabilities-not-fixing-with-audit-force-fix/5945)
- [Party ID resolution complexity](https://forum.canton.network/t/party-ids-in-canton/4664)

---

## License

Apache 2.0 — free to use, fork, and build on.

> "Daml" and "Canton" are registered trademarks of Digital Asset Holdings, LLC. Nexus Framework is an independent open-source project and is not affiliated with or endorsed by Digital Asset. All references to Daml and Canton are used in a descriptive capacity to indicate compatibility.
