import type { ConstructNexusApi, DamlTemplate, NexusServer } from "@nexus-framework/core/server";
import { os } from "@orpc/server";
import { 
  createErrorHandlerMiddleware, 
  createRateLimitMiddleware, 
  createRequireRoleMiddleware 
} from "./middleware/index";

/**
 * Creates a Nexus-flavored oRPC factory.
 * Automatically handles ledger injection via nexus.forRequest(req).
 */
export function createNexusOrpc<
  T extends Record<string, DamlTemplate<any>>
>(
  nexus: NexusServer<T, any>
) {
  type Ledger = ConstructNexusApi<T>;
  
  // Base oRPC instance with context
  const base = os
    .$context<{ req: Request }>()
    .use(async ({ context, next }) => {
      // Automatically inject ledger for the current request
      const ledger = await nexus.forRequest(context.req);
      return next({ 
        context: { 
          ...context,
          ledger: ledger satisfies Ledger
        } 
      });
    });

  return {
    /**
     * Base procedure with ledger context automatically injected.
     */
    procedure: base,
    
    /**
     * Semantic alias for read-only procedures.
     */
    query: base,
    
    /**
     * Semantic alias for state-changing procedures.
     */
    action: base,
    
    /**
     * Router factory.
     */
    router: <TRoutes extends Record<string, unknown>>(routes: TRoutes) => routes,
    
    /**
     * Built-in Nexus middlewares.
     */
    middleware: {
      requireRole: createRequireRoleMiddleware(),
      rateLimit: createRateLimitMiddleware(),
      errorHandler: createErrorHandlerMiddleware(),
    },
  } as const;
}

export type NexusOrpc<T extends Record<string, DamlTemplate<any>>> = ReturnType<typeof createNexusOrpc<T>>;
