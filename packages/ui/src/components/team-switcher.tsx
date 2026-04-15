"use client";

import { Avatar, AvatarFallback } from "@nexus/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@nexus/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@nexus/ui/components/sidebar";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";

export interface Organization {
	id: string;
	name: string;
}

interface TeamSwitcherProps {
	organizations: Organization[];
	currentOrganization: Organization;
	onOrganizationChange: (organization: Organization) => void;
	isLoading?: boolean;
}

export function TeamSwitcher({
	organizations,
	currentOrganization,
	onOrganizationChange,
	isLoading = false,
}: TeamSwitcherProps) {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							disabled={isLoading}
						>
							<Avatar className="h-6 w-6 rounded-md">
								<AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
									{currentOrganization.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="truncate text-sm font-medium">{currentOrganization.name}</span>
							<ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side="bottom"
						align="start"
						sideOffset={4}
					>
						{organizations.map((org, index) => (
							<React.Fragment key={org.id}>
								{index > 0 && <DropdownMenuSeparator />}
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => onOrganizationChange(org)}
								>
									<Avatar className="mr-2 h-6 w-6 rounded-md">
										<AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
											{org.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="flex-1 truncate">{org.name}</span>
									{org.id === currentOrganization.id && (
										<span className="ml-auto text-xs text-muted-foreground">Aktif</span>
									)}
								</DropdownMenuItem>
							</React.Fragment>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem className="cursor-pointer">
							<PlusIcon className="mr-2 h-4 w-4" />
							Organizasyon ekle
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
