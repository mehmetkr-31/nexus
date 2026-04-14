/**
 * Shared constants for both Client and Server components.
 * This file MUST NOT import any Node.js or Server-only APIs (like next/headers).
 */

export const CANTON_API_URL =
	process.env.NEXT_PUBLIC_CANTON_API_URL ?? process.env.CANTON_API_URL ?? "http://localhost:7575";

export const SANDBOX_USER_ID =
	process.env.NEXT_PUBLIC_SANDBOX_USER_ID ?? process.env.SANDBOX_USER_ID ?? "alice";

export const IOU_TEMPLATE_ID = "nexus-example:Iou:Iou";
