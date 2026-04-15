import { ORPCError } from "@orpc/server";

/**
 * Middleware to map Canton/Daml errors to oRPC errors.
 */
export function createErrorHandlerMiddleware() {
  return () => {
    return async ({ 
      context, 
      next 
    }: {
      context: unknown;
      next: (args: { context: unknown }) => Promise<unknown>;
    }) => {
      try {
        return await next({ context });
      } catch (error: unknown) {
        const err = error as Error & { message?: string };
        
        // Canton gRPC/HTTP errors mapping
        if (err.message?.includes("PERMISSION_DENIED")) {
          throw new ORPCError("FORBIDDEN", {
            message: "Canton permission denied",
            cause: err,
          });
        }
        
        if (err.message?.includes("NOT_FOUND")) {
          throw new ORPCError("NOT_FOUND", {
            message: "Contract not found",
            cause: err,
          });
        }
        
        if (err.message?.includes("ABORTED")) {
          throw new ORPCError("CONFLICT", {
            message: "Transaction aborted",
            cause: err,
          });
        }
        
        // Re-throw if already ORPCError
        if (error instanceof ORPCError) {
          throw error;
        }
        
        // Generic internal error
        throw new ORPCError("INTERNAL_ERROR", {
          message: err.message || "Unknown error",
          cause: err,
        });
      }
    };
  };
}
