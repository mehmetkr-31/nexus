import type { NexusClient, SubmitResult } from "@nexus-framework/core";
import { NexusError } from "@nexus-framework/core";

// ─── LedgerActionResult ───────────────────────────────────────────────────────

export type LedgerActionResult<T = SubmitResult> =
	| { success: true; data: T }
	| { success: false; error: string; code?: string };

// ─── withLedgerAction ─────────────────────────────────────────────────────────

/**
 * Wraps a ledger operation in a Next.js Server Action-compatible pattern.
 * Catches NexusErrors and returns a serializable result object.
 *
 * @example
 * ```ts
 * // app/actions.ts
 * "use server";
 * import { withLedgerAction } from "@nexus-framework/react/server";
 * import { createServerNexusClient } from "@nexus-framework/react/server";
 *
 * export async function transferIou(formData: FormData) {
 *   const nexus = await createServerNexusClient({ request: ..., config: ... });
 *   return withLedgerAction(nexus, async (client) => {
 *     return client.ledger.commands.exerciseChoice(
 *       "pkg:Mod:Iou",
 *       formData.get("contractId") as string,
 *       "Transfer",
 *       { newOwner: formData.get("newOwner") as string },
 *       ["Alice::abc"],
 *     );
 *   });
 * }
 * ```
 */
export async function withLedgerAction<T = SubmitResult>(
	client: NexusClient,
	action: (client: NexusClient) => Promise<T>,
): Promise<LedgerActionResult<T>> {
	try {
		const data = await action(client);
		return { success: true, data };
	} catch (err) {
		if (err instanceof NexusError) {
			return {
				success: false,
				error: err.message,
				code: err.code,
			};
		}
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}
