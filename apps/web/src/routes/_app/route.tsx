import { SidebarInset, SidebarProvider } from "@nexus/ui/components/sidebar";
import { SiteHeader } from "@nexus/ui/components/site-header";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
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
					<div className="@container/main flex flex-1 flex-col p-8">
						<Outlet />
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
