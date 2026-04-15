/**
 * Shared constants for both Client and Server components.
 * This file MUST NOT import any Node.js or Server-only APIs (like next/headers).
 */

export const CANTON_API_URL =
	process.env.NEXT_PUBLIC_CANTON_API_URL ?? process.env.CANTON_API_URL ?? "http://localhost:7575";

/**
 * Default sandbox user ID (can be overridden via X-Sandbox-User header).
 * For multi-user testing, send requests with different user IDs:
 * - X-Sandbox-User: alice
 * - X-Sandbox-User: bob
 * - X-Sandbox-User: charlie
 */
export const SANDBOX_USER_ID =
	process.env.NEXT_PUBLIC_SANDBOX_USER_ID ?? process.env.SANDBOX_USER_ID ?? "alice";

export const SANDBOX_SECRET =
	process.env.NEXT_PUBLIC_SANDBOX_SECRET ?? process.env.SANDBOX_SECRET ?? "secret";

export const IOU_TEMPLATE_ID = "nexus-example:Iou:Iou";

/**
 * Available sandbox users for multi-user testing
 */
export const SANDBOX_USERS = ["alice", "bob", "charlie"] as const;
export type SandboxUser = (typeof SANDBOX_USERS)[number];
