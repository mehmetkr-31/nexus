"use client";

import { nexus } from "../lib/nexus-client";

export function NexusClientProvider({ children }: { children: React.ReactNode }) {
	return <nexus.NexusProvider>{children}</nexus.NexusProvider>;
}
