# Nexus Framework

**The modern TypeScript SDK for building production-grade dApps on the Canton Network.**

Nexus bridges the gap between Daml smart contracts and modern web applications. It gives you a type-safe, isomorphic client layer that plugs directly into Next.js, React 19, and TanStack Query — so you can focus on product logic instead of infrastructure plumbing.

---

## Why Nexus?

Building a Canton frontend today means re-implementing the same hard problems from scratch on every project:

| Problem | Legacy Reality | Nexus Solution |
|---|---|---|
| JWT authentication | Custom per-team infrastructure, "a black box requiring weeks of work" | `sandboxAuth()`, `jwtAuth()`, `oidcAuth()` — one line of config |
| Party ID resolution | Multi-step: create party → map username → generate token | `client.auth.partyId.resolvePartyId("alice")` with 5-min cache |
| React compatibility | `@daml/react` pins to **React 16.12** with a confirmed WebSocket memory leak at ~500 connections | Full React 18/19 Concurrent Mode + Suspense support |
| Next.js SSR | No established pattern exists | Native Server Components, Server Actions, and `HttpOnly` cookie sessions |
| Package ID discovery | Manual caching layers, "opaque" discovery | `PackageResolver` parses DALF bytes and caches automatically |
| Ledger consensus UI | Mutations resolve on HTTP status codes, not ledger finality | `waitForTransaction()` + `transactionStatusQueryOptions()` |
| PQS queries | Raw SQL with manual RLS setup | `KyselyPqsEngine` with automatic Row Level Security per party |

---

## Packages

| Package | Description |
|---|---|
| [`@nexus-framework/core`](./framework/core) | Canton HTTP client, auth plugins, session manager, package resolver |
| [`@nexus-framework/react`](./framework/react) | TanStack Query hooks, streaming, identity, SSR adapters |
| [`@nexus-framework/pqs`](./framework/pqs) | Lightweight PQS client (Bun.SQL, no ORM dependency) |
| [`@nexus/cli`](./framework/cli) | `create-nexus-app` — interactive project scaffolder |

---

## Installation

```bash
# Core (server-side or isomorphic)
bun add @nexus-framework/core

# React + TanStack Query integration
bun add @nexus-framework/react @tanstack/react-query

# PQS client (optional, for Postgres reads)
bun add @nexus-framework/pqs

# CLI
bunx @nexus/cli
```

---

## Quick Start

### 1. Client-side (React / Vite)

```ts
// lib/nexus.ts
import { createNexus, sandboxAuth } from "@nexus-framework/core";
import { createNexusClient, tanstackQueryPlugin, identityPlugin } from "@nexus-framework/react";

// Create the raw Nexus HTTP client
const nexus = await createNexus({
  ledgerApiUrl: "http://localhost:7575",
  plugins: [
    sandboxAuth({ userId: "alice", secret: "secret" }),
  ],
});

// Wrap it for React
export const nexusClient = createNexusClient(nexus, [
  tanstackQueryPlugin(),
  identityPlugin(),
]);
```

```tsx
// components/IouList.tsx
"use client";
import { nexusClient } from "@/lib/nexus";

export function IouList({ partyId }: { partyId: string }) {
  const { contracts, isLoading } = nexusClient.useContracts({
    templateId: "my-pkg:Iou:Iou",
    parties: [partyId],
  });

  if (isLoading) return <Spinner />;
  return contracts.map((c) => <IouCard key={c.contractId} iou={c.payload} />);
}
```

### 2. Server-side (Next.js App Router)

```ts
// lib/nexus-server.ts
import { SessionManager, sandboxAuth } from "@nexus-framework/core";
import { createNexusServer } from "@nexus-framework/core/server";
import { Iou } from "@daml.js/my-package";

export const sessionManager = new SessionManager({
  encryptionKey: process.env.SESSION_KEY, // 32-byte hex string
});

// Unified server instance — one config, three access patterns
export const nexus = await createNexusServer({
  ledgerApiUrl: process.env.CANTON_API_URL!,
  pqsUrl: process.env.PQS_URL,             // optional: enables findMany() SQL reads
  auth: sandboxAuth({ userId: "alice", secret: process.env.SANDBOX_SECRET! }),
  types: { Iou: Iou.Iou },                  // Daml codegen types
  sessionManager,
});
```

```tsx
// app/contracts/page.tsx  (Server Component)
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { nexus } from "@/lib/nexus-server";

export default async function ContractsPage() {
  const partyId = await nexus.client.auth.partyId.resolvePartyId("alice");

  const queryClient = new QueryClient();
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

```ts
// app/actions.ts  (Server Action)
"use server";
import { nexus } from "@/lib/nexus-server";

export async function createIou(req: Request, owner: string, amount: string) {
  const ctx = await nexus.forRequest(req); // reads session cookie
  return ctx.Iou.create({ owner, amount, currency: "USD" });
}
```

---

## Auth Plugins

All three auth plugins implement the `NexusPlugin` interface and integrate with the same token refresh dispatch system.

### `sandboxAuth` — Local Development

Self-signed HMAC-256 JWTs. **Not for production.**

```ts
import { sandboxAuth } from "@nexus-framework/core";

sandboxAuth({
  userId: "alice",
  secret: "secret",
  partyId: "Alice::122059a10c67ef1bb38e4e7ff...", // optional — resolved automatically if omitted
})
```

Also exposes `getAdminToken()` for sandbox provisioning operations (party allocation, user creation).

### `jwtAuth` — Static or Refreshable JWT

```ts
import { jwtAuth } from "@nexus-framework/core";

// Static token
jwtAuth({ token: process.env.CANTON_TOKEN! })

// With auto-refresh (called 30s before expiry)
jwtAuth({
  token: currentToken,
  refreshToken: () => fetchNewTokenFromYourIdP(),
})
```

### `oidcAuth` — OIDC Client Credentials

```ts
import { oidcAuth } from "@nexus-framework/core";

oidcAuth({
  tokenEndpoint: "https://keycloak.example.com/realms/canton/protocol/openid-connect/token",
  clientId: "canton-app",
  clientSecret: process.env.OIDC_SECRET,
  // Optional: verify tokens against the provider's JWKS before use
  jwksUri: "https://keycloak.example.com/realms/canton/.well-known/jwks.json",
  issuer: "https://keycloak.example.com/realms/canton",
  audience: "https://daml.com/jwt/aud/participant/sandbox-participant",
})
```

When `jwksUri` is provided, every fetched token is verified with `crypto.subtle` before being used — matching the `jwks_uri` you configure in Canton's `IdentityProviderConfig`.

---

## TanStack Query Integration

`tanstackQueryPlugin` generates fully typed React hooks that share query keys with the server-side `prefetchQuery` calls — zero duplication, zero extra network round-trips after hydration.

```ts
const nexusClient = createNexusClient(nexus, [tanstackQueryPlugin()]);
```

### Reading contracts

```tsx
// Active contracts (first page)
const { contracts, isLoading } = nexusClient.useContracts<IouPayload>({
  templateId: "my-pkg:Iou:Iou",
  parties: [partyId],
});

// All pages (auto-fetched, use with care on large datasets)
const { contracts } = nexusClient.useContracts({ templateId, parties, fetchAll: true });

// Suspense variant
const { contracts } = nexusClient.useContractsSuspense({ templateId, parties });

// Cursor-based infinite scroll
const { data, fetchNextPage } = nexusClient.usePagedContracts({ templateId, parties, pageSize: 50 });

// Single contract by ID (O(1) Canton native lookup)
const { data: contract } = nexusClient.useFetchById({ templateId, contractId });

// Single contract by Daml key (O(1) Canton native lookup)
const { data: contract } = nexusClient.useFetchByKey({
  templateId: "my-pkg:Account:Account",
  key: { owner: partyId },
});

// Interface views
const { interfaces } = nexusClient.useInterface<TransferView>({
  interfaceId: "my-pkg:Iou:Transferable",
  parties: [partyId],
});
```

### Writing to the ledger

```tsx
// Create a contract
const create = nexusClient.useCreateContract({
  onSuccess: () => queryClient.invalidateQueries(...),
});

create.mutate({
  templateId: "my-pkg:Iou:Iou",
  createArguments: { owner: partyId, amount: "100", currency: "USD" },
  actAs: [partyId],
});

// Exercise a choice
const exercise = nexusClient.useExerciseChoice({ onSuccess: invalidate });
exercise.mutate({
  templateId: "my-pkg:Iou:Iou",
  contractId: "...",
  choice: "Transfer",
  choiceArgument: { newOwner: "Bob::abc..." },
  actAs: [partyId],
});

// Exercise and get the return value (full TransactionResult)
const exerciseAndGet = nexusClient.useExerciseAndGetResult();
```

### Transaction finality tracking

Nexus resolves only after actual ledger consensus, not just an HTTP 200.

```tsx
const [transactionId, setTransactionId] = useState<string>();

const { data: status } = nexusClient.useCommandStatus(transactionId, {
  onFinalized: () => console.log("Confirmed on ledger!"),
});
// status: "pending" | "finalized" | "failed"
```

---

## Query Key Factories

All query keys follow a structured hierarchy under the `"nexus"` prefix — safe to co-locate with other TanStack Query data in your app.

```ts
import { nexusKeys, invalidateContractQueries } from "@nexus-framework/react";

// Invalidate all IOU queries after a command
await invalidateContractQueries(queryClient, ["my-pkg:Iou:Iou"]);

// Invalidate everything (e.g. after logout)
await invalidateAllNexusQueries(queryClient);

// Manual fine-grained control
queryClient.invalidateQueries({ queryKey: nexusKeys.contractsByTemplate("my-pkg:Iou:Iou") });
queryClient.invalidateQueries({ queryKey: nexusKeys.all() });
```

Key hierarchy:
```
["nexus"]
["nexus", "contracts"]
["nexus", "contracts", templateId]
["nexus", "contracts", templateId, { parties, filter }]
["nexus", "contracts", templateId, "id", contractId, { parties }]
["nexus", "contracts", templateId, "key", key, { parties }]
["nexus", "interfaces", interfaceId, { parties }]
["nexus", "ledger-end"]
["nexus", "synchronizers"]
["nexus", "party", userId]
["nexus", "transaction", transactionId]
```

---

## Server-Side Rendering

### `createNexusServer` — Unified server factory

Returns three access patterns from a single config:

```ts
const nexus = await createNexusServer({ ledgerApiUrl, pqsUrl, auth, types, sessionManager });

// 1. Raw HTTP client — TanStack prefetch, ledger queries, party ID resolution
nexus.client.auth.partyId.resolvePartyId("alice");
nexus.client.ledger.identity.getLedgerEnd();
nexus.client.query.contracts({ templateId, parties });

// 2. Party-scoped context — PQS reads + Canton HTTP writes
const ctx = nexus.forParty(partyId, token);
await ctx.Iou.findMany({ where: { currency: "USD" }, limit: 20 });
await ctx.Iou.create({ owner: partyId, amount: "100", currency: "USD" });
await ctx.Iou.exercise(contractId, "Transfer", { newOwner: bobPartyId });
await ctx.Iou.archive(contractId);
await ctx.Iou.findById(contractId);

// 3. Request-scoped context — reads session cookie automatically
const ctx = await nexus.forRequest(req); // throws NexusAuthError if no valid session
await ctx.Iou.findMany();
```

### `SessionManager` — AES-GCM cookie sessions

```ts
import { SessionManager, generateEncryptionKey } from "@nexus-framework/core";

// Generate a key (run once, store in your secret manager)
const key = generateEncryptionKey(); // 64-char hex string

const sessionManager = new SessionManager({
  encryptionKey: key,     // AES-256-GCM encryption
  ttlMs: 60 * 60 * 1000, // 1 hour (default)
  secure: true,            // Secure flag (auto-true in production)
  cookieName: "nexus_session",
});

// Create a session after login
const cookie = await sessionManager.createSessionCookie({ partyId, token });
res.headers.set("Set-Cookie", cookie);

// Read in a Server Action or route handler
const session = await sessionManager.requireSession(req); // throws if missing/expired
const session = await sessionManager.getSessionFromRequest(req); // returns null if missing
```

### `createLedgerRouteHandler` — JWT proxy (B2B pattern)

Keeps JWTs server-side by proxying Canton API calls through a Next.js route handler.

```ts
// app/api/ledger/[...path]/route.ts
import { createLedgerRouteHandler } from "@nexus-framework/react/server";

const handler = createLedgerRouteHandler({
  ledgerApiUrl: process.env.CANTON_API_URL!,
  mountPath: "/api/ledger",
  sessionManager,                          // shared instance
  allowedPaths: ["/v2/state/", "/v2/commands/"], // optional allowlist
});

export const GET = handler;
export const POST = handler;
```

### `withLedgerAction` — Server Action error wrapper

```ts
// app/actions.ts
"use server";
import { withLedgerAction } from "@nexus-framework/react/server";

export async function transferIou(req: Request, contractId: string, newOwner: string) {
  const ctx = await nexus.forRequest(req);
  return withLedgerAction(nexus.client, async (client) => {
    return ctx.Iou.exercise(contractId, "Transfer", { newOwner });
  });
  // Returns: { success: true, data } | { success: false, error, code }
}
```

---

## PQS — Participant Query Store

The PQS engine queries the Canton Postgres replica using Kysely, with automatic Row Level Security per party.

```ts
// Activated automatically when pqsUrl is set in createNexusServer:
const ctx = nexus.forParty(partyId, token);

// SQL-backed O(log N) queries
const ious = await ctx.Iou.findMany({
  where: { currency: "USD" },
  orderBy: { amount: "desc" },
  limit: 50,
});

const iou = await ctx.Iou.findById("00abc123...");
```

If `pqsUrl` is not set, `findMany()` throws with a helpful message and `findById()` falls back to the Canton HTTP `POST /v2/contracts/contract-by-id` endpoint automatically.

The standalone `@nexus-framework/pqs` package exposes a lighter `PqsClient` using `Bun.SQL` directly for environments where Kysely isn't needed:

```ts
import { PqsClient } from "@nexus-framework/pqs";

const pqs = new PqsClient(process.env.PQS_DATABASE_URL!);

const { contracts } = await pqs.getActiveContracts<IouPayload>("my-pkg:Iou:Iou", {
  parties: ["Alice::abc..."],
  payloadFilter: { currency: "USD" },
});
```

---

## WebSocket Streaming

Real-time contract updates via Canton's native WebSocket API, with automatic JWT subprotocol auth and `updateToken()` for seamless token refresh.

```ts
// Low-level (CantonClient)
const handle = await nexus.client.http.streamActiveContracts(
  "my-pkg:Iou:Iou",
  {
    onCreate: (contract) => console.log("Created:", contract.contractId),
    onArchive: (contractId) => console.log("Archived:", contractId),
    onLive: () => console.log("Stream is live (caught up to ledger end)"),
    onError: (err) => console.error(err),
  },
  { parties: [partyId] },
);

handle.close();
handle.updateToken(newToken); // re-connects transparently
handle.connected; // boolean
```

```tsx
// React hook (streamingPlugin)
const nexusClient = createNexusClient(nexus, [streamingPlugin()]);

const { contracts, connected } = nexusClient.useStreamContracts<IouPayload>({
  templateId: "my-pkg:Iou:Iou",
  parties: [partyId],
});
```

### Completion stream

Track command lifecycle (submitted → accepted/rejected) without polling:

```ts
const ledgerEnd = await nexus.client.ledger.identity.getLedgerEnd();
const handle = await nexus.client.http.streamCompletions(
  [partyId],
  ledgerEnd.offset,
  {
    onCompletion: (event) => {
      // event: { commandId, submissionId, status, offset, updateId, errorMessage }
      if (event.status === 0) console.log("Accepted:", event.updateId);
      else console.error("Rejected:", event.errorMessage);
    },
  },
);
```

---

## Package Resolver

Nexus automatically resolves Daml package names to Canton Package IDs by parsing DALF binary metadata — no manual ID management needed.

```ts
// Use short template names in your code:
nexus.client.query.contracts({ templateId: "my-pkg:Iou:Iou", parties: [partyId] });

// Nexus resolves to the full ID at runtime:
// → "122059a10c67ef1bb38e4e7ff3fd9c827e2e6cbb:Iou:Iou"
```

The resolver fetches package bytes once, caches them per session, and supports multiple uploaded versions of the same package name.

---

## Plugin System

All framework capabilities are composable via a plugin architecture. Plugins can contribute auth, fetch middleware, and typed context to the `NexusClient`.

```ts
// Client-side plugins
const nexusClient = createNexusClient(nexus, [
  tanstackQueryPlugin(),    // useContracts, useExerciseChoice, useCommandStatus, ...
  streamingPlugin(),        // useStreamContracts, useMultiStream
  identityPlugin(),         // useUser, useParties, useAuthStatus
  optimisticUiPlugin({      // declarative optimistic updates
    updates: [
      {
        templateId: "my-pkg:Iou:Iou",
        onChoice: (choice, arg, contract) =>
          choice === "Archive" ? { ...contract, archived: true } : null,
      },
    ],
  }),
]);

// Server-side plugins (passed to createNexus / createNexusServer)
const nexus = await createNexus({
  ledgerApiUrl,
  plugins: [
    sandboxAuth({ userId, secret }),
    fetchMiddlewarePlugin({           // custom fetch middleware
      onRequest: (config) => { /* mutate headers */ return config; },
      onResponse: (res, config) => { /* log, trace */ },
      onError: (err, config) => { /* report to Sentry */ },
    }),
    packageDiscoveryPlugin(),         // pre-warm package cache on startup
  ],
});
```

### Building a custom plugin

```ts
import type { NexusPlugin } from "@nexus-framework/core";

const auditPlugin: NexusPlugin<{ audit: { log: (msg: string) => void } }> = {
  id: "audit",
  init: async (client) => ({
    audit: {
      log: (msg) => console.log(`[${new Date().toISOString()}] ${msg}`),
    },
  }),
};

const nexus = await createNexus({ plugins: [sandboxAuth(...), auditPlugin] });
nexus.audit.log("Hello from audit plugin"); // fully typed
```

---

## Error Handling

Nexus has three error classes, all exported from `@nexus-framework/core`:

| Class | When thrown |
|---|---|
| `NexusError` | Base class for all Nexus errors |
| `NexusLedgerError` | Canton API errors — includes `statusCode` and `details` |
| `NexusAuthError` | Session missing, expired, or decryption failed |

```ts
import { NexusLedgerError, NexusAuthError } from "@nexus-framework/core";

try {
  await ctx.Iou.create({ owner: partyId, amount: "100", currency: "USD" });
} catch (err) {
  if (err instanceof NexusLedgerError) {
    console.error(err.statusCode, err.details); // e.g. 409, { message: "DUPLICATE_COMMAND" }
  }
}
```

**Canton-specific deduplication is handled automatically:**
- `DUPLICATE_COMMAND` (HTTP 409) → treated as success, returns existing `updateId`
- `SUBMISSION_ALREADY_IN_FLIGHT` (HTTP 425) → single retry with a fresh `submissionId`

---

## CLI — `create-nexus-app`

Scaffold a new project with pre-configured Canton connectivity:

```bash
bunx create-nexus-app
# or
bunx create-nexus-app my-dapp
```

Interactive prompts select:
- **Framework:** Next.js (App Router) *(Vite coming soon)*
- **Auth:** Canton Sandbox (local) or JWT / Better Auth (production)

The generated project includes:
- `lib/nexus-server.ts` — unified server instance
- `lib/nexus.ts` — React client with TanStack Query
- Environment variable template (`.env.example`)
- Example Server Component with prefetch + hydration boundary
- Example Server Action with `withLedgerAction`

---

## CantonClient — Low-level HTTP API

`CantonClient` is the HTTP adapter at the core of Nexus. All higher-level APIs are built on top of it.

```ts
import { CantonClient } from "@nexus-framework/core";

const http = new CantonClient({
  baseUrl: "http://localhost:7575",
  apiPathPrefix: "/v2",       // default
  getToken: () => myAuthFlow(),
  timeoutMs: 30_000,
  middlewares: [loggingMiddleware],
});

// State
await http.getLedgerEnd();                     // { offset: string }
await http.getConnectedSynchronizers();        // SynchronizerInfo[]

// Contracts
await http.queryContracts("pkg:Mod:Entity", { parties: [partyId] });
await http.getContractById(contractId, { parties: [partyId] });
await http.getContractByKey("pkg:Mod:Entity", { owner: partyId }, { parties: [partyId] });
await http.queryByInterface("pkg:Mod:Iface", { parties: [partyId] });

// Commands
await http.submitAndWait({ commands: [...], actAs: [partyId] });
await http.submitAndWaitForTransaction({ commands: [...], actAs: [partyId] });

// Finality
await http.waitForTransaction(transactionId, { timeoutMs: 30_000 });

// Packages
await http.listPackages();
await http.getPackageBytes(packageId);

// Streaming
await http.streamActiveContracts(templateId, handlers, { parties });
await http.streamCompletions(parties, fromOffset, handlers);
```

---

## Type Utilities

```ts
import type {
  ActiveContract,           // { contractId, templateId, payload, createdAt, ... }
  ActiveContractsResponse,  // { contracts, nextPageToken? }
  ActiveInterface,          // { contractId, templateId, interfaceView, payload, ... }
  NexusSession,             // { partyId, token, expiresAt }
  SubmitResult,             // { updateId, completionOffset }
  TransactionResult,        // { transactionId, commandId, offset, completedAt, events }
  TransactionStatus,        // "pending" | "finalized" | "failed"
  SynchronizerInfo,         // { synchronizerId, synchronizerAlias, connected }
  LedgerEnd,                // { offset: string }
  StreamHandle,             // { close(), updateToken(token), connected }
} from "@nexus-framework/core";
```

---

## Configuration Reference

### `createNexusServer` options

| Option | Type | Required | Description |
|---|---|---|---|
| `ledgerApiUrl` | `string` | ✓ | Canton JSON Ledger API base URL |
| `auth` | `NexusPlugin` | ✓ | Auth plugin: `sandboxAuth`, `jwtAuth`, or `oidcAuth` |
| `types` | `Record<string, DamlTemplate>` | ✓ | Daml codegen type map — keys become `forParty()` accessor names |
| `pqsUrl` | `string` | | Postgres connection string for PQS SQL reads |
| `sessionManager` | `SessionManager` | | Required for `nexus.forRequest(req)` |
| `plugins` | `NexusPlugin[]` | | Extra plugins (`fetchMiddlewarePlugin`, `packageDiscoveryPlugin`, ...) |
| `timeoutMs` | `number` | | Request timeout in ms (default: 30 000) |
| `apiPathPrefix` | `string` | | API path prefix (default: `/v2`) |

### `SessionManager` options

| Option | Type | Default | Description |
|---|---|---|---|
| `encryptionKey` | `string` | | 32-byte hex key for AES-256-GCM encryption |
| `cookieName` | `string` | `nexus_session` | Cookie name |
| `ttlMs` | `number` | `3 600 000` | Session TTL (1 hour) |
| `secure` | `boolean` | `true` in production | Sets `Secure` cookie flag |
| `domain` | `string` | | Cookie domain |
| `path` | `string` | `/` | Cookie path |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                          │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │ Server Component │    │ Client Component              │  │
│  │                  │    │                               │  │
│  │ nexus.client.*   │    │ nexusClient.useContracts()    │  │
│  │ nexus.forParty() │    │ nexusClient.useExercise...()  │  │
│  │ nexus.forReq()   │    │ nexusClient.useStreamContracts│  │
│  └────────┬─────────┘    └──────────────┬────────────────┘  │
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│              @nexus-framework/core                          │
│                                                             │
│  ┌────────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  CantonClient  │  │PackageResolver│  │ SessionManager │  │
│  │  (HTTP + WS)   │  │(DALF parser) │  │ (AES-GCM)      │  │
│  └───────┬────────┘  └─────────────┘  └────────────────┘  │
│          │                                                  │
│  ┌───────┴───────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  Auth Plugins  │  │  PQS Engine  │  │ Middleware API  │  │
│  │  sandbox/jwt/  │  │ (Kysely SQL) │  │ onReq/onRes/   │  │
│  │  oidc + JWKS   │  │  + RLS       │  │ onError        │  │
│  └───────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────┐    ┌──────────────────────────────────┐
│ Canton JSON Ledger  │    │ Canton PQS (Postgres)             │
│ API (HTTP + WS)     │    │ active_contracts table            │
└─────────────────────┘    └──────────────────────────────────┘
```

---

## References

**Canton Network**
- [Canton Network](https://www.canton.network/)
- [Daml Ledger API](https://docs.daml.com/app-dev/ledger-api.html)
- [Daml JSON API](https://docs.daml.com/json-api/index.html)
- [Canton PQS](https://docs.digitalasset.com/build/3.4/sdlc-howtos/canton/participant-query-store)

**Ecosystem Integration**
- [TanStack Query](https://tanstack.com/query/latest)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Better Auth](https://www.better-auth.com/)
- [Kysely](https://kysely.dev/)

**Community Evidence & Background**
- [Canton Developer Survey 2026](https://forum.canton.network/t/canton-network-developer-experience-and-tooling-survey-analysis-2026/8412)
- [JWT auth questions](https://forum.canton.network/t/jwt-auth-questions/2525)
- [WebSocket memory leak in @daml/react](https://forum.canton.network/t/can-i-explicitly-release-websocket-connections-used-in-the-daml-react-bindings/5297)
- [React hook WebSockets failing on unmount](https://forum.canton.network/t/react-hook-websockets-failing-on-unmount-preventing-future-reconnects/4186)
- [Party ID resolution complexity](https://forum.canton.network/t/party-ids-in-canton/4664)

---

## License

Apache 2.0

*"Daml" and "Canton" are registered trademarks of Digital Asset Holdings, LLC. Nexus Framework is an independent open-source project and is not affiliated with or endorsed by Digital Asset.*
