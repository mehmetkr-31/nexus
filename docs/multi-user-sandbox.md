# Multi-User Sandbox Testing Guide

The Nexus Framework supports **multi-user sandbox mode** for production-like development and testing. This allows you to simulate multiple users interacting with the same Canton ledger.

---

## How It Works

When using `sandboxAuth`, the framework **automatically provisions users** and creates session cookies on the first request. You can specify which user to authenticate as via:

1. **`X-Sandbox-User` header** (highest priority - for automation/testing)
2. **`sandbox_user` query parameter** (for UI testing)
3. **Default user** (configured in environment variables)

---

## Setup

### 1. Enable Auto-Provisioning

In your ledger route handler, pass the `nexusServer` instance:

```typescript
// app/api/ledger/[...path]/route.ts
import { createLedgerRouteHandler } from "@nexus-framework/react/server";
import { nexus, sessionManager } from "@/lib/nexus-server";

const handler = createLedgerRouteHandler({
  ledgerApiUrl: process.env.CANTON_API_URL!,
  mountPath: "/api/ledger",
  sessionManager,
  nexusServer: nexus, // ✅ Auto-detects sandboxAuth
});

export const GET = handler;
export const POST = handler;
```

That's it! No manual provisioning logic needed.

---

## Usage

### Option 1: HTTP Headers (Testing & Automation)

Send requests with different user IDs:

```bash
# Test as Alice
curl -H "X-Sandbox-User: alice" http://localhost:3000/api/ledger/v2/parties

# Test as Bob
curl -H "X-Sandbox-User: bob" http://localhost:3000/api/ledger/v2/parties

# Test as Charlie
curl -H "X-Sandbox-User: charlie" http://localhost:3000/api/ledger/v2/parties
```

**Use case:** Automated tests, CI/CD pipelines, Postman collections

---

### Option 2: Query Parameters (Browser Testing)

Add `?sandbox_user=<username>` to your URL:

```
http://localhost:3000/contracts?sandbox_user=bob
```

The first request will provision Bob and set a session cookie. Subsequent requests use the session.

**Use case:** Manual browser testing, QA workflows

---

### Option 3: Custom getUserId Function

For advanced scenarios, provide your own user resolution logic:

```typescript
const handler = createLedgerRouteHandler({
  ledgerApiUrl: process.env.CANTON_API_URL!,
  mountPath: "/api/ledger",
  sessionManager,
  sandbox: {
    enabled: true,
    getUserId: async (req) => {
      // Read from custom header
      const userId = req.headers.get('X-Custom-User-Id');
      if (userId) return userId;
      
      // Or resolve from JWT claims in a cookie
      const jwt = req.cookies.get('auth_token');
      if (jwt) {
        const claims = decodeJwt(jwt);
        return claims.sub;
      }
      
      // Default fallback
      return 'alice';
    },
    secret: process.env.SANDBOX_SECRET!,
  }
});
```

---

## Multi-User Test Scenarios

### Scenario 1: Create IOU as Alice, Transfer to Bob

```bash
# 1. Alice creates an IOU
curl -X POST http://localhost:3000/api/iou/create \
  -H "X-Sandbox-User: alice" \
  -H "Content-Type: application/json" \
  -d '{"issuer": "Alice", "owner": "Alice", "amount": "100", "currency": "USD"}'

# 2. Bob queries IOUs (should see none)
curl http://localhost:3000/api/iou/list \
  -H "X-Sandbox-User: bob"

# 3. Alice transfers IOU to Bob
curl -X POST http://localhost:3000/api/iou/transfer \
  -H "X-Sandbox-User: alice" \
  -d '{"contractId": "...", "newOwner": "Bob"}'

# 4. Bob queries IOUs again (should see the transferred IOU)
curl http://localhost:3000/api/iou/list \
  -H "X-Sandbox-User: bob"
```

### Scenario 2: Parallel User Sessions

Open multiple browser tabs:

- Tab 1: `http://localhost:3000?sandbox_user=alice`
- Tab 2: `http://localhost:3000?sandbox_user=bob`
- Tab 3: `http://localhost:3000?sandbox_user=charlie`

Each tab maintains its own session cookie with a different user.

---

## How Auto-Provisioning Works

When a request arrives without a valid session:

1. **Detect Sandbox Mode:** Check if `sandboxAuth` plugin is configured
2. **Resolve User ID:** From header, query param, or default
3. **Provision in Canton:**
   - Allocate Canton party (e.g., `Alice::1220...`)
   - Create ledger user with `actAs`/`readAs` rights
4. **Generate JWT:** Self-signed HMAC-256 token
5. **Set Session Cookie:** Encrypted, HttpOnly, SameSite=Lax
6. **Forward Request:** To Canton with JWT injected

**Idempotency:** Re-provisioning the same user is safe (Canton returns existing party).

---

## Production Considerations

**⚠️ Auto-provisioning is for development only!**

In production:

1. Replace `sandboxAuth()` with `oidcAuth()` or `jwtAuth()`
2. Remove `nexusServer` from `createLedgerRouteHandler` config
3. Require explicit login via `/api/auth/login` endpoint
4. Use real user management (Keycloak, Auth0, etc.)

**Migration Example:**

```typescript
// Development
const nexus = await createNexusServer({
  auth: sandboxAuth({ userId: "alice", secret: "secret" }),
  // ...
});

// Production
const nexus = await createNexusServer({
  auth: oidcAuth({
    tokenEndpoint: process.env.OIDC_TOKEN_ENDPOINT!,
    clientId: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_SECRET!,
  }),
  // ...
});
```

---

## Advanced: Dynamic Multi-User with getUserId

For production-like sandbox behavior, use the `getUserId` callback in your `sandboxAuth` plugin:

```typescript
// lib/nexus-server.ts
export const nexus = await createNexusServer({
  auth: sandboxAuth({
    secret: "secret",
    getUserId: (ctx) => {
      // Priority: header > query > default
      return (
        ctx.headers.get('X-Sandbox-User') ??
        new URL(ctx.url).searchParams.get('sandbox_user') ??
        'alice'
      );
    }
  }),
  sessionManager,
  types: { Iou: Iou.Iou },
});
```

This makes `nexus.forRequest(req)` return different contexts per user automatically.

---

## Summary

| Feature | Single-User (Old) | Multi-User (New) |
|---------|-------------------|------------------|
| **User Provisioning** | Manual setup | Automatic on-demand |
| **User Switching** | Restart server | Send header/query param |
| **Testing** | Limited to one user | Simulate real workflows |
| **Production-Like** | ❌ No | ✅ Yes |
| **Code Complexity** | High (custom logic) | Low (built-in) |

**Result:** Sandbox mode now provides a **production-like multi-user experience** with zero boilerplate! 🎉
