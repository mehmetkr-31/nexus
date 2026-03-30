"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useRef } from "react";

export function NexusProvider({ children }: { children: ReactNode }) {
	const queryClientRef = useRef<QueryClient>(null);
	if (!queryClientRef.current) {
		queryClientRef.current = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 5_000,
					retry: 2,
					retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
				},
				mutations: {
					retry: 0,
				},
			},
		});
	}

	return <QueryClientProvider client={queryClientRef.current}>{children}</QueryClientProvider>;
}
