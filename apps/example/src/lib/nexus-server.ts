import { createNexusServerClient } from "@nexus-framework/core/server";
import { Iou } from "@daml.js/nexus-example-0.0.1";

const CANTON_API_URL = process.env.CANTON_API_URL ?? "http://localhost:7575";

// Canton Participant Node usually opens a dummy postgres on 5432. 
// You can enter your own production PQS here.
const PQS_URL = process.env.PQS_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

/**
 * Our Isomorphic Server Client (for Server Actions, API routes, and ORPC/Trpc)
 * It is completely HIDDEN from the Browser (Frontend bundle).
 * 
 * We map the real Daml templates from @daml.js packages to the keys we want.
 */
export const backendSDK = createNexusServerClient(
	{
		Iou: Iou.Iou,
	},
	{
		ledgerUrl: CANTON_API_URL,
		pqsUrl: PQS_URL,
	},
);
