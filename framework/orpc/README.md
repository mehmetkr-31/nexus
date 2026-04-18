# @nexus-framework/orpc

Native oRPC integration for the Nexus Framework. This package provides a fluent, type-safe API for defining ledger-backed procedures with zero boilerplate.

## Installation

```bash
pnpm add @nexus-framework/orpc
```

## Features

- **Fluent API**: Use the native oRPC `.input().handler()` chain.
- **Auto-injected Ledger**: The `ledger` context is automatically available in every handler.
- **Built-in Middleware**: RBAC (`requireRole`), Rate Limiting, and Canton Error Mapping.
- **Zero Generics**: Full type inference for inputs and ledger operations.

## Quick Start

### 1. Initialize Factory

```ts
import { createNexusOrpc } from "@nexus-framework/orpc";
import { nexus } from "./nexus-server";

export const orpc = createNexusOrpc(nexus);
```

### 2. Define a Router

```ts
import { orpc } from "./lib/orpc";
import { z } from "zod";

export const signetRouter = orpc.router({
  listWallets: orpc.query
    .input(z.object({ limit: z.number().default(10) }))
    .handler(({ input, context }) => 
      context.ledger.MultisigWallet.findMany({ limit: input.limit })
    ),
    
  proposeTransfer: orpc.action
    .input(ProposeTransferSchema)
    .use(orpc.middleware.requireRole("Admin"))
    .handler(({ input, context }) => 
      context.ledger.MultisigWallet.exercise(input.walletCid, "ProposeTransfer", input)
    ),
});
```

## Middleware

### RBAC (`requireRole`)

Enforces hierarchical roles on a specific wallet. Requires `walletCid` in the input.

```ts
orpc.action
  .use(orpc.middleware.requireRole("Owner"))
  .handler(...)
```

### Error Handler

Maps Canton-specific gRPC/HTTP errors to standard oRPC errors (e.g., `PERMISSION_DENIED` -> `FORBIDDEN`).

```ts
orpc.action
  .use(orpc.middleware.errorHandler())
  .handler(...)
```

## License

Apache-2.0
