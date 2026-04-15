import type { FetchMiddleware, NexusPlugin } from "../types/plugin";

/**
 * Create a plugin that attaches fetch middleware hooks (onRequest, onResponse, onError)
 * to the underlying CantonClient HTTP pipeline.
 */
export function fetchMiddlewarePlugin(middleware: FetchMiddleware): NexusPlugin {
	return { id: "fetch-middleware", middleware };
}
