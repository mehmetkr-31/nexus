"use client";

import { Avatar, AvatarFallback } from "@nexus/ui/components/avatar";
import { Badge } from "@nexus/ui/components/badge";
import { Button } from "@nexus/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@nexus/ui/components/card";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@nexus/ui/components/drawer";
import { Input } from "@nexus/ui/components/input";
import { Separator } from "@nexus/ui/components/separator";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ActivityIcon,
	Building2Icon,
	CalendarIcon,
	KeyRoundIcon,
	MailIcon,
	MoreHorizontal,
	PenToolIcon,
	PlusIcon,
	SearchIcon,
	SettingsIcon,
	ShieldCheckIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/dashboard/users/")({
	component: RouteComponent,
});

type MemberStatus = "active" | "pending" | "invited";
type MemberRole = "Owner" | "Admin" | "Editor" | "Viewer";

interface Member {
	id: string;
	name: string;
	email: string;
	role: MemberRole;
	status: MemberStatus;
	organization: string;
	organizationId: string;
	threshold: number;
	totalThreshold: number;
	signatureCount: number;
	canSign: boolean;
}

const organizations = [
	{ id: "all", name: "Tümü", count: 5 },
	{ id: "nexus", name: "Nexus Tech", count: 2 },
	{ id: "finance", name: "Finance Team", count: 1 },
	{ id: "dev", name: "Development", count: 2 },
];

const members: Member[] = [
	{
		id: "1",
		name: "Ahmet Yılmaz",
		email: "ahmet@nexus.io",
		role: "Owner",
		status: "active",
		organization: "Nexus Tech",
		organizationId: "nexus",
		threshold: 2,
		totalThreshold: 3,
		signatureCount: 12,
		canSign: true,
	},
	{
		id: "2",
		name: "Fatma Demir",
		email: "fatma@nexus.io",
		role: "Admin",
		status: "active",
		organization: "Nexus Tech",
		organizationId: "nexus",
		threshold: 1,
		totalThreshold: 3,
		signatureCount: 8,
		canSign: true,
	},
	{
		id: "3",
		name: "Mehmet Kaya",
		email: "mehmet@nexus.io",
		role: "Editor",
		status: "pending",
		organization: "Finance Team",
		organizationId: "finance",
		threshold: 0,
		totalThreshold: 2,
		signatureCount: 0,
		canSign: false,
	},
	{
		id: "4",
		name: "Ayşe Şahin",
		email: "ayse@nexus.io",
		role: "Editor",
		status: "active",
		organization: "Development",
		organizationId: "dev",
		threshold: 1,
		totalThreshold: 2,
		signatureCount: 5,
		canSign: true,
	},
	{
		id: "5",
		name: "Ali Özdemir",
		email: "ali@nexus.io",
		role: "Viewer",
		status: "invited",
		organization: "Development",
		organizationId: "dev",
		threshold: 0,
		totalThreshold: 2,
		signatureCount: 0,
		canSign: false,
	},
];

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();
}

function getStatusConfig(status: string) {
	switch (status) {
		case "active":
			return {
				label: "Aktif",
				className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
				dotClassName: "bg-green-500",
			};
		case "pending":
			return {
				label: "Beklemede",
				className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
				dotClassName: "bg-yellow-500",
			};
		case "invited":
			return {
				label: "Davet Gönderildi",
				className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
				dotClassName: "bg-blue-500",
			};
		default:
			return {
				label: "Pasif",
				className: "bg-muted text-muted-foreground border-muted",
				dotClassName: "bg-muted-foreground",
			};
	}
}

function getRoleConfig(role: string) {
	switch (role) {
		case "Owner":
			return {
				variant: "default" as const,
				icon: true,
			};
		case "Admin":
			return {
				variant: "secondary" as const,
				icon: true,
			};
		case "Editor":
			return {
				variant: "outline" as const,
				icon: false,
			};
		default:
			return {
				variant: "outline" as const,
				icon: false,
			};
	}
}

function ThresholdBadge({ current, total }: { current: number; total: number }) {
	return (
		<div className="flex items-center gap-1.5">
			<div className="flex gap-0.5">
				{Array.from({ length: total }).map((_, i) => (
					<div
						key={i}
						className={`size-2 rounded-full ${i < current ? "bg-primary" : "bg-muted"}`}
					/>
				))}
			</div>
			<span className="text-xs text-muted-foreground">
				{current}/{total}
			</span>
		</div>
	);
}

function MemberCard({ member }: { member: Member }) {
	const navigate = useNavigate();
	const statusConfig = getStatusConfig(member.status);
	const roleConfig = getRoleConfig(member.role);

	return (
		<Drawer direction="right">
			<DrawerTrigger asChild>
				<Card className="hover:bg-muted/30 transition-all cursor-pointer group select-none">
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<div className="relative">
									<Avatar className="size-12">
										<AvatarFallback className="bg-primary/10 text-sm font-medium">
											{getInitials(member.name)}
										</AvatarFallback>
									</Avatar>
									<div
										className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${statusConfig.dotClassName}`}
									/>
								</div>
								<div>
									<CardTitle className="text-base">{member.name}</CardTitle>
									<CardDescription className="flex items-center gap-1">
										<MailIcon className="size-3" />
										{member.email}
									</CardDescription>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<MoreHorizontal className="size-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<div className="flex items-center gap-2 flex-wrap">
							<Badge variant={roleConfig.variant} className="gap-1">
								{roleConfig.icon && <ShieldCheckIcon className="size-3" />}
								{member.role}
							</Badge>
							<Badge variant="outline" className="gap-1 text-muted-foreground">
								<Building2Icon className="size-3" />
								{member.organization}
							</Badge>
							<Badge variant="outline" className={statusConfig.className}>
								{statusConfig.label}
							</Badge>
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="flex flex-col gap-1">
									<span className="text-xs text-muted-foreground">Yetki Eşiği</span>
									<ThresholdBadge current={member.threshold} total={member.totalThreshold} />
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-muted-foreground">İmza Sayısı</span>
									<span className="text-sm font-medium flex items-center gap-1">
										<PenToolIcon className="size-3 text-muted-foreground" />
										{member.signatureCount}
									</span>
								</div>
							</div>
							<Badge variant={member.canSign ? "default" : "secondary"} className="gap-1 text-xs">
								<PenToolIcon className="size-3" />
								{member.canSign ? "İmzalayabilir" : "İmzalayamaz"}
							</Badge>
						</div>
					</CardContent>
				</Card>
			</DrawerTrigger>
			<DrawerContent className="h-full max-w-md">
				<DrawerHeader className="border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Avatar className="size-12">
								<AvatarFallback className="bg-primary/10 text-sm font-medium">
									{getInitials(member.name)}
								</AvatarFallback>
							</Avatar>
							<div>
								<DrawerTitle className="text-lg">{member.name}</DrawerTitle>
								<DrawerDescription className="flex items-center gap-1">
									<MailIcon className="size-3" />
									{member.email}
								</DrawerDescription>
							</div>
						</div>
						<DrawerClose asChild>
							<Button variant="ghost" size="icon" className="size-8">
								<XIcon className="size-4" />
							</Button>
						</DrawerClose>
					</div>
				</DrawerHeader>
				<div className="flex flex-col gap-6 p-4 overflow-y-auto">
					<div className="flex flex-col gap-3">
						<h4 className="text-sm font-medium text-muted-foreground">Üyelik Bilgileri</h4>
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<ShieldCheckIcon className="size-3" />
									Rol
								</span>
								<Badge variant={roleConfig.variant} className="w-fit gap-1">
									{roleConfig.icon && <ShieldCheckIcon className="size-3" />}
									{member.role}
								</Badge>
							</div>
							<div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<Building2Icon className="size-3" />
									Organizasyon
								</span>
								<span className="text-sm font-medium">{member.organization}</span>
							</div>
							<div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<KeyRoundIcon className="size-3" />
									Yetki Eşiği
								</span>
								<ThresholdBadge current={member.threshold} total={member.totalThreshold} />
							</div>
							<div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<ActivityIcon className="size-3" />
									Durum
								</span>
								<Badge variant="outline" className={`w-fit ${statusConfig.className}`}>
									{statusConfig.label}
								</Badge>
							</div>
						</div>
					</div>

					<Separator />

					<div className="flex flex-col gap-3">
						<h4 className="text-sm font-medium text-muted-foreground">İmza Bilgileri</h4>
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<PenToolIcon className="size-3" />
									Toplam İmza
								</span>
								<span className="text-2xl font-bold">{member.signatureCount}</span>
							</div>
							<div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50">
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<CalendarIcon className="size-3" />
									Son İmza
								</span>
								<span className="text-sm font-medium">2 saat önce</span>
							</div>
						</div>
						<Badge
							variant={member.canSign ? "default" : "secondary"}
							className="w-fit gap-1.5 text-sm"
						>
							<PenToolIcon className="size-4" />
							{member.canSign ? "İmzalayabilir" : "İmzalayamaz"}
						</Badge>
					</div>

					<Separator />

					<div className="flex flex-col gap-3">
						<h4 className="text-sm font-medium text-muted-foreground">Son Aktiviteler</h4>
						<div className="flex flex-col gap-2">
							<div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
								<div className="flex items-center justify-center size-8 rounded-full bg-green-500/10">
									<PenToolIcon className="size-4 text-green-600 dark:text-green-400" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">Sözleşme imzaladı</p>
									<p className="text-xs text-muted-foreground truncate">Şirket Sözleşmesi #1234</p>
								</div>
								<span className="text-xs text-muted-foreground whitespace-nowrap">2 saat önce</span>
							</div>
							<div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
								<div className="flex items-center justify-center size-8 rounded-full bg-blue-500/10">
									<ActivityIcon className="size-4 text-blue-600 dark:text-blue-400" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">Giriş yaptı</p>
									<p className="text-xs text-muted-foreground truncate">Chrome / macOS</p>
								</div>
								<span className="text-xs text-muted-foreground whitespace-nowrap">3 saat önce</span>
							</div>
						</div>
					</div>
				</div>
				<DrawerFooter className="border-t gap-2 py-4">
					<Button
						variant="outline"
						className="flex-1 font-semibold py-3 text-base gap-1.5"
						onClick={() => navigate({ to: "/dashboard/users/settings" })}
					>
						<SettingsIcon className="size-4" />
						Ayarla
					</Button>
					<Button variant="destructive" className="flex-1 font-semibold py-3 text-base">
						Kaldır
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function OrganizationGroup({
	organizationName,
	members: orgMembers,
}: {
	organizationName: string;
	members: Member[];
	organizationId: string;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Building2Icon className="size-4 text-muted-foreground" />
				<h3 className="font-semibold text-sm">{organizationName}</h3>
				<Badge variant="secondary" className="text-xs">
					{orgMembers.length} üye
				</Badge>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{orgMembers.map((member) => (
					<MemberCard key={member.id} member={member} />
				))}
			</div>
		</div>
	);
}

function RouteComponent() {
	const [selectedOrg, setSelectedOrg] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredMembers =
		selectedOrg === "all" ? members : members.filter((m) => m.organizationId === selectedOrg);

	const searchedMembers = searchQuery
		? filteredMembers.filter(
			(m) =>
				m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.email.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		: filteredMembers;

	const groupedByOrganization = searchedMembers.reduce(
		(acc, member) => {
			if (!acc[member.organizationId]) {
				acc[member.organizationId] = {
					name: member.organization,
					members: [],
				};
			}
			acc[member.organizationId].members.push(member);
			return acc;
		},
		{} as Record<string, { name: string; members: Member[] }>,
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Üyeler</h1>
					<p className="text-muted-foreground">
						Organizasyon üyelerini ve imza yetkilerini yönetin
					</p>
				</div>
				<Button>
					<PlusIcon className="size-4 mr-2" />
					Üye Davet Et
				</Button>
			</div>

			<div>
				<CardHeader className="pb-4">
					<div className="flex flex-col gap-4">
						<div className="relative flex-1">
							<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Üye ara..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="flex items-center gap-2 overflow-x-auto pb-1">
							<UsersIcon className="size-4 text-muted-foreground shrink-0" />
							{organizations.map((org) => (
								<Button
									key={org.id}
									variant={selectedOrg === org.id ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedOrg(org.id)}
									className="shrink-0 gap-1.5"
								>
									{org.name}
									<Badge
										variant={selectedOrg === org.id ? "secondary" : "outline"}
										className="text-xs"
									>
										{org.count}
									</Badge>
								</Button>
							))}
						</div>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					{Object.entries(groupedByOrganization).length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<UsersIcon className="size-12 text-muted-foreground/50 mb-4" />
							<p className="text-muted-foreground">Sonuç bulunamadı</p>
						</div>
					) : selectedOrg === "all" ? (
						Object.entries(groupedByOrganization).map(([orgId, org]) => (
							<OrganizationGroup
								key={orgId}
								organizationId={orgId}
								organizationName={org.name}
								members={org.members}
							/>
						))
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{searchedMembers.map((member) => (
								<MemberCard key={member.id} member={member} />
							))}
						</div>
					)}
				</CardContent>
			</div>
		</div>
	);
}
