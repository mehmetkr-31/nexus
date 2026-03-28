"use server";

import { withLedgerAction } from "@nexus-framework/react/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getServerClient, IOU_TEMPLATE_ID, SANDBOX_PARTY_ID } from "../../lib/nexus";

async function getClient() {
	const jar = await cookies();
	const cookieHeader = jar.toString();
	return getServerClient(cookieHeader || null);
}

export async function createIouAction(formData: FormData) {
	const owner = (formData.get("owner") as string | null)?.trim() ?? SANDBOX_PARTY_ID;
	const amount = (formData.get("amount") as string | null)?.trim() ?? "100";
	const currency = (formData.get("currency") as string | null)?.trim() ?? "USD";

	const client = await getClient();
	const result = await withLedgerAction(client, (c) =>
		c.ledger.commands.createContract(IOU_TEMPLATE_ID, { owner, amount, currency }, [owner]),
	);

	if (result.success) {
		revalidatePath("/contracts");
	}

	return result;
}

export async function archiveIouAction(contractId: string, actAs: string) {
	const client = await getClient();
	const result = await withLedgerAction(client, (c) =>
		c.ledger.commands.exerciseChoice(IOU_TEMPLATE_ID, contractId, "Archive", {}, [actAs]),
	);

	if (result.success) {
		revalidatePath("/contracts");
	}

	return result;
}
