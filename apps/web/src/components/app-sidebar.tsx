"use client";

import { NavUser } from "@nexus/ui/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@nexus/ui/components/sidebar";
import { Link, linkOptions } from "@tanstack/react-router";
import { LayoutDashboardIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type * as React from "react";
import { useEffect, useState } from "react";

// Define navigation items with linkOptions for type safety
const mainNavItems = linkOptions([
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: <LayoutDashboardIcon />,
		activeOptions: { exact: true },
	},
	{
		to: "/dashboard/users",
		label: "Users",
		icon: <UsersIcon />,
		activeOptions: { exact: true },
	},
]);

const secondaryNavItems = linkOptions([
	{
		to: "/dashboard/components_lib",
		label: "Components",
		icon: <LayoutDashboardIcon />,
		activeOptions: { exact: true },
	},
	{
		to: "/dashboard/settings",
		label: "Settings",
		icon: <SettingsIcon />,
		activeOptions: { exact: true },
	},
]);

function NavMainItems() {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Main</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{mainNavItems.map((item) => (
						<SidebarMenuItem key={item.label}>
							<Link {...item} preload="intent">
								{({ isActive }) => (
									<SidebarMenuButton tooltip={item.label} isActive={isActive}>
										{item.icon}
										<span>{item.label}</span>
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function NavSecondaryItems() {
	return (
		<SidebarGroup className="mt-auto">
			<SidebarGroupLabel>More</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{secondaryNavItems.map((item) => (
						<SidebarMenuItem key={item.label}>
							<Link {...item}>
								{({ isActive }) => (
									<SidebarMenuButton tooltip={item.label} isActive={isActive}>
										{item.icon}
										<span>{item.label}</span>
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const user = {
		name: "User",
		email: "user@example.com",
		avatar: "/avatars/user.jpg",
	};
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = mounted && resolvedTheme === "dark";

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<Link to="/">
							{({ isActive }) => (
								<SidebarMenuButton isActive={isActive} className="py-5">
									<img
										src={isDark ? "/assets/logo_white.png" : "/assets/logo_black.png"}
										alt="Nexus Logo"
										className="h-10 w-auto object-contain"
									/>
								</SidebarMenuButton>
							)}
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMainItems />
				<NavSecondaryItems />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
