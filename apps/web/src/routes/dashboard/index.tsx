import { SidebarInset, SidebarProvider } from "@nexus/ui/components/sidebar";
import { SiteHeader } from "@nexus/ui/components/site-header";

import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/dashboard/")({
	component: Page,
});

function Page() {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "16rem",
					"--header-height": "3rem",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							<div className="px-4 lg:px-6">
								<h1 className="text-3xl font-bold">Dashboard</h1>
								<p className="text-muted-foreground mt-2">Welcome to your dashboard</p>
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
