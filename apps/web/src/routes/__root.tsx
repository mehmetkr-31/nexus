import { Toaster } from "@nexus/ui/components/sonner";
import { ThemeProvider } from "@nexus/ui/components/theme-provider";
import { TooltipProvider } from "@nexus/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { orpc } from "@/utils/orpc";

import "../index.css";
export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Nexus - Multi-Signature on Canton Network",
			},
			{
				name: "description",
				content:
					"Nexus is a Canton-native multi-signature platform for secure treasury approvals, governance and institutional custody workflows.",
			},
		],
		links: [],
	}),

	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					<TooltipProvider>
						<div className="">
							<Outlet />
						</div>
						<Toaster richColors />
						<TanStackRouterDevtools position="bottom-right" />
						<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
						<Scripts />
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
