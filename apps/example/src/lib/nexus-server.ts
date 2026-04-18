import { Iou, MultisigWallet } from "@daml.js/nexus-example-0.0.1";
import { SessionManager, sandboxAuth } from "@nexus-framework/core";
import { createNexusServer } from "@nexus-framework/core/server";
import { tanstackQueryPlugin } from "@nexus-framework/react/server";

const CANTON_API_URL = process.env.CANTON_API_URL ?? "http://127.0.0.1:7575";
const PQS_URL = process.env.PQS_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
const SESSION_SECRET = process.env.SESSION_SECRET;
const SANDBOX_USER_ID = process.env.SANDBOX_USER_ID ?? "alice";
const SANDBOX_SECRET = process.env.SANDBOX_SECRET ?? "secret";

/**
 * Nexus session manager — handles `nexus_session` cookie serialization.
 * Shared between the server client and the ledger route handler proxy.
 */
export const sessionManager = new SessionManager({
	encryptionKey: SESSION_SECRET,
});

/**
 * Unified Nexus server instance.
 *
 * - `nexus.client`          → Canton HTTP NexusClient (TanStack prefetch, ledger queries)
 * - `nexus.forParty(id)`    → PQS reads + Canton writes for a specific party
 * - `nexus.forRequest(req)` → Session cookie → forParty() (use in Server Actions, Hono, etc.)
 */
export const nexus = await createNexusServer({
	ledgerApiUrl: CANTON_API_URL,
	pqsUrl: PQS_URL,
	auth: sandboxAuth({ userId: SANDBOX_USER_ID, secret: SANDBOX_SECRET }),
	types: {
		Iou: Iou.Iou,
		MultisigWallet: MultisigWallet.MultisigWallet,
		TransactionProposal: MultisigWallet.TransactionProposal,
		GovernanceProposal: MultisigWallet.GovernanceProposal,
		PendingWalletUpdate: MultisigWallet.PendingWalletUpdate,
	},
	sessionManager,
	plugins: [tanstackQueryPlugin()],
});

/**
 * Legacy: backendSDK — for backward compatibility with existing code.
 * @deprecated Use `nexus.forParty(partyId, token)` instead.
 */
export const backendSDK = {
	withUser: (partyId: string, token?: string) => nexus.forParty(partyId, token),
};
