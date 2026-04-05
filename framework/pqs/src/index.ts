/**
 * @deprecated The `@nexus-framework/pqs` package is deprecated.
 *
 * Use the server-side PQS integration in `@nexus-framework/core` instead:
 * ```ts
 * import { pqsDatabasePlugin } from "@nexus-framework/core"
 *
 * const nexus = await createNexusServerClient({
 *   // ...
 *   plugins: [pqsDatabasePlugin({ url: process.env.PQS_DATABASE_URL! })],
 * })
 * // nexus.withUser(partyId).Iou.findMany({ where: { owner: partyId } })
 * ```
 *
 * The `PqsClient` class queries the same `active_contracts` table but requires
 * manual SQL composition. The plugin approach provides type-safe queries with
 * automatic RLS enforcement.
 */
export { PqsClient } from "./pqs-client.ts";
export type { ActiveContractRow, PqsContract, PqsQueryOptions } from "./types.ts";
