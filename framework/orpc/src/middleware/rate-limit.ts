import { ORPCError } from "@orpc/server";

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

export interface RateLimitContext {
  session?: {
    user?: {
      id: string;
    };
  };
  req?: Request;
}

/**
 * Basic in-memory rate limiting middleware.
 */
export function createRateLimitMiddleware() {
  return (maxRequests: number, windowMs: number = 60000) => {
    return async ({ 
      context, 
      next 
    }: {
      context: RateLimitContext;
      next: (args: { context: RateLimitContext }) => Promise<unknown>;
    }) => {
      const userId = context.session?.user?.id || context.req?.headers.get("x-forwarded-for");
      
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED");
      }
      
      const now = Date.now();
      const userLimit = store[userId];
      
      if (!userLimit || now > userLimit.resetAt) {
        store[userId] = { count: 1, resetAt: now + windowMs };
      } else {
        userLimit.count++;
        
        if (userLimit.count > maxRequests) {
          throw new ORPCError("TOO_MANY_REQUESTS", {
            message: `Rate limit exceeded: ${maxRequests} requests per ${windowMs}ms`,
          });
        }
      }
      
      return next({ context });
    };
  };
}
