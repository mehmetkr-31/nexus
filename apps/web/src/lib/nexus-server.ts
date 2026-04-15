import { MultisigWallet } from "@daml.js/nexus-example-0.0.1";
import { SessionManager, sandboxAuth } from "@nexus-framework/core";
import { createNexusServer } from "@nexus-framework/core/server";

const CANTON_API_URL = process.env.CANTON_API_URL ?? "http://127.0.0.1:7575";
const PQS_URL = process.env.PQS_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
const SESSION_SECRET = process.env.SESSION_SECRET;
const SANDBOX_USER_ID = process.env.SANDBOX_USER_ID ?? "alice";
const SANDBOX_SECRET = process.env.SANDBOX_SECRET ?? "secret";

export const sessionManager = new SessionManager({
	encryptionKey: SESSION_SECRET,
});

export const nexus = await createNexusServer({
	ledgerApiUrl: CANTON_API_URL,
	pqsUrl: PQS_URL,
	auth: sandboxAuth({ userId: SANDBOX_USER_ID, secret: SANDBOX_SECRET }),
	types: {
		MultisigWallet: MultisigWallet.MultisigWallet,
		TransactionProposal: MultisigWallet.TransactionProposal,
		GovernanceProposal: MultisigWallet.GovernanceProposal,
		PendingWalletUpdate: MultisigWallet.PendingWalletUpdate,
	},
	sessionManager,
});
