"use client";

import { NexusProvider } from "@nexus-framework/react";
import type { NexusConfig } from "@nexus-framework/react";

const config: NexusConfig = {
	ledgerApiUrl: process.env["NEXT_PUBLIC_CANTON_API_URL"] ?? "http://localhost:7575",
	auth: {
		type: "sandbox",
		secret: process.env["NEXT_PUBLIC_SANDBOX_SECRET"] ?? "secret",
		userId: process.env["NEXT_PUBLIC_SANDBOX_USER_ID"] ?? "alice",
		partyId:
			process.env["NEXT_PUBLIC_SANDBOX_PARTY_ID"] ??
			"Alice::122059a10c67ef1bb38e4e7ff3fd9c827e2e6cbbfd68bb5cd8fa4c0c56fecdf0734b",
	},
};

export function NexusClientProvider({ children }: { children: React.ReactNode }) {
	return <NexusProvider config={config}>{children}</NexusProvider>;
}
