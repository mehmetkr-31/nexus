"use server";

import { createNexusClient } from "@nexus-framework/core";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CANTON_API_URL, sessionManager } from "../../lib/nexus";

type LoginState = { error: string } | null;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
	const userId = (formData.get("userId") as string | null)?.trim();
	const partyId = (formData.get("partyId") as string | null)?.trim();
	const secret = (formData.get("secret") as string | null)?.trim();

	if (!userId || !partyId || !secret) {
		return { error: "All fields are required." } satisfies LoginState;
	}

	// Generate a sandbox JWT to verify credentials work
	const client = createNexusClient({
		ledgerApiUrl: CANTON_API_URL,
		auth: { type: "sandbox", secret, userId, partyId },
	});

	let token: string;
	try {
		token = await client.getToken();
	} catch {
		return {
			error: "Failed to authenticate with the ledger. Check your credentials.",
		} satisfies LoginState;
	}

	const cookieHeader = await sessionManager.createSessionCookie({
		token,
		userId,
		partyId,
	});

	// Set the session cookie
	const jar = await cookies();
	const [name, ...rest] = cookieHeader.split("=");
	const value = rest.join("=").split(";")[0] ?? "";
	jar.set(name ?? "nexus_session", value, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60, // 1 hour
	});

	redirect("/contracts");
}

export async function logoutAction() {
	const jar = await cookies();
	jar.delete("nexus_session");
	redirect("/login");
}
