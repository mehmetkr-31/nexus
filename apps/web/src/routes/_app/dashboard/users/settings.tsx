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
import { Input } from "@nexus/ui/components/input";
import { Label } from "@nexus/ui/components/label";
import { Separator } from "@nexus/ui/components/separator";
import { Switch } from "@nexus/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nexus/ui/components/tabs";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	BellIcon,
	PenToolIcon,
	SaveIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/dashboard/users/settings")({
	component: RouteComponent,
});

const organizations = [
	{ id: "nexus", name: "Nexus Tech" },
	{ id: "finance", name: "Finance Team" },
	{ id: "dev", name: "Development" },
];

const roles = [
	{ id: "owner", name: "Owner", description: "Tam yetki, organizasyonu yönetebilir" },
	{ id: "admin", name: "Admin", description: "Üyeleri yönetebilir, imza atabilir" },
	{ id: "editor", name: "Editor", description: "Doküman oluşturabilir, imza atabilir" },
	{ id: "viewer", name: "Viewer", description: "Sadece görüntüleme yetkisi" },
];

function RouteComponent() {
	const navigate = useNavigate();
	const [selectedOrg, setSelectedOrg] = useState("nexus");
	const [settings, setSettings] = useState({
		name: "Ahmet Yılmaz",
		email: "ahmet@nexus.io",
		role: "owner" as const,
		organizationId: "nexus",
		threshold: 2,
		totalThreshold: 5,
		canSign: true,
		canCreate: true,
		canInvite: false,
		canDelete: false,
		notifyOnPending: true,
		notifyOnComplete: true,
		notifyOnNewMember: false,
	});

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard/users" })}>
					<ArrowLeftIcon className="size-4" />
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Üye Ayarları</h1>
					<p className="text-muted-foreground">Üye yapılandırmasını yönetin</p>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[240px_1fr]">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/50">
						<Avatar className="size-16">
							<AvatarFallback className="bg-primary/10 text-lg font-semibold">AY</AvatarFallback>
						</Avatar>
						<div className="text-center">
							<p className="font-semibold">{settings.name}</p>
							<p className="text-sm text-muted-foreground">{settings.email}</p>
						</div>
						<Badge
							variant={
								settings.role === "owner"
									? "default"
									: settings.role === "admin"
										? "secondary"
										: "outline"
							}
						>
							{settings.role.charAt(0).toUpperCase() + settings.role.slice(1)}
						</Badge>
					</div>

					<Separator />

					<div className="flex flex-col gap-2">
						<span className="text-sm font-medium text-muted-foreground px-2">Organizasyon Seç</span>
						{organizations.map((org) => (
							<Button
								key={org.id}
								variant={selectedOrg === org.id ? "secondary" : "ghost"}
								className="justify-start gap-2"
								onClick={() => {
									setSelectedOrg(org.id);
									setSettings((prev) => ({ ...prev, organizationId: org.id }));
								}}
							>
								{org.name}
							</Button>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-6">
					<Tabs defaultValue="profile" className="w-full">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="profile" className="gap-1.5">
								<UsersIcon className="size-4" />
								Profil
							</TabsTrigger>
							<TabsTrigger value="role" className="gap-1.5">
								<ShieldCheckIcon className="size-4" />
								Rol
							</TabsTrigger>
							<TabsTrigger value="permissions" className="gap-1.5">
								<PenToolIcon className="size-4" />
								Yetkiler
							</TabsTrigger>
							<TabsTrigger value="notifications" className="gap-1.5">
								<BellIcon className="size-4" />
								Bildirimler
							</TabsTrigger>
						</TabsList>

						<TabsContent value="profile" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>Profil Bilgileri</CardTitle>
									<CardDescription>Üyenin temel bilgilerini düzenleyin</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<div className="flex flex-col gap-2">
										<Label htmlFor="name">İsim</Label>
										<Input
											id="name"
											value={settings.name}
											onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="email">E-posta</Label>
										<Input
											id="email"
											type="email"
											value={settings.email}
											onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="org">Organizasyon</Label>
										<select
											id="org"
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											value={settings.organizationId}
											onChange={(e) => {
												setSelectedOrg(e.target.value);
												setSettings((prev) => ({ ...prev, organizationId: e.target.value }));
											}}
										>
											{organizations.map((org) => (
												<option key={org.id} value={org.id}>
													{org.name}
												</option>
											))}
										</select>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="role" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>Rol Yönetimi</CardTitle>
									<CardDescription>
										Üyenin rolünü ve organizasyondaki konumunu belirleyin
									</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<div className="grid gap-3">
										{roles.map((role) => (
											<button
												key={role.id}
												type="button"
												className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors text-left ${
													settings.role === role.id
														? "border-primary bg-primary/5"
														: "border-border hover:bg-muted/50"
												}`}
												onClick={() =>
													setSettings((prev) => ({ ...prev, role: role.id as typeof prev.role }))
												}
											>
												<div className="flex items-center gap-3">
													<div
														className={`size-5 rounded-full border-2 flex items-center justify-center ${
															settings.role === role.id
																? "border-primary bg-primary"
																: "border-muted-foreground"
														}`}
													>
														{settings.role === role.id && (
															<div className="size-2 rounded-full bg-primary-foreground" />
														)}
													</div>
													<div>
														<p className="font-medium">{role.name}</p>
														<p className="text-sm text-muted-foreground">{role.description}</p>
													</div>
												</div>
												{settings.role === role.id && (
													<Badge variant="default" className="ml-4">
														Seçili
													</Badge>
												)}
											</button>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="permissions" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>İmza Yetkileri</CardTitle>
									<CardDescription>Üyenin imza ve işlem yetkilerini yapılandırın</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">İmza Yetkisi</span>
											<span className="text-sm text-muted-foreground">
												Üye işlemleri imzalayabilir
											</span>
										</div>
										<Switch
											checked={settings.canSign}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, canSign: checked }))
											}
										/>
									</div>

									<Separator />

									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Oluşturma Yetkisi</span>
											<span className="text-sm text-muted-foreground">
												Üye yeni işlem oluşturabilir
											</span>
										</div>
										<Switch
											checked={settings.canCreate}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, canCreate: checked }))
											}
										/>
									</div>

									<Separator />

									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Davet Yetkisi</span>
											<span className="text-sm text-muted-foreground">
												Üye yeni üyeler davet edebilir
											</span>
										</div>
										<Switch
											checked={settings.canInvite}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, canInvite: checked }))
											}
										/>
									</div>

									<Separator />

									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Silme Yetkisi</span>
											<span className="text-sm text-muted-foreground">Üye işlemleri silebilir</span>
										</div>
										<Switch
											checked={settings.canDelete}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, canDelete: checked }))
											}
										/>
									</div>

									<Separator />

									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Yetki Eşiği</span>
											<span className="text-sm text-muted-foreground">Kaç imza gerekli</span>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="icon"
												className="size-8"
												onClick={() =>
													setSettings((prev) => ({
														...prev,
														threshold: Math.max(0, prev.threshold - 1),
													}))
												}
											>
												-
											</Button>
											<Badge
												variant="outline"
												className="text-lg px-3 py-1 min-w-[3rem] justify-center"
											>
												{settings.threshold}
											</Badge>
											<Button
												variant="outline"
												size="icon"
												className="size-8"
												onClick={() =>
													setSettings((prev) => ({
														...prev,
														threshold: Math.min(prev.totalThreshold, prev.threshold + 1),
													}))
												}
											>
												+
											</Button>
											<span className="text-sm text-muted-foreground">
												/ {settings.totalThreshold}
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="notifications" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>Bildirim Ayarları</CardTitle>
									<CardDescription>Üye için bildirim tercihleri</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Bekleyen İşlem Bildirimi</span>
											<span className="text-sm text-muted-foreground">
												Yeni bekleyen işlemler hakkında bildirim al
											</span>
										</div>
										<Switch
											checked={settings.notifyOnPending}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, notifyOnPending: checked }))
											}
										/>
									</div>

									<Separator />

									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Tamamlanma Bildirimi</span>
											<span className="text-sm text-muted-foreground">
												İşlem tamamlandığında bildirim al
											</span>
										</div>
										<Switch
											checked={settings.notifyOnComplete}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, notifyOnComplete: checked }))
											}
										/>
									</div>

									<Separator />

									<div className="flex items-center justify-between">
										<div className="flex flex-col gap-1">
											<span className="font-medium">Yeni Üye Bildirimi</span>
											<span className="text-sm text-muted-foreground">
												Organizasyona yeni üye eklendiğinde bildirim al
											</span>
										</div>
										<Switch
											checked={settings.notifyOnNewMember}
											onCheckedChange={(checked) =>
												setSettings((prev) => ({ ...prev, notifyOnNewMember: checked }))
											}
										/>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					<div className="flex items-center justify-between gap-2">
						<Button variant="destructive" className="gap-1.5">
							<Trash2Icon className="size-4" />
							Üyeyi Kaldır
						</Button>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => navigate({ to: "/dashboard/users" })}>
								İptal
							</Button>
							<Button>
								<SaveIcon className="size-4 mr-2" />
								Kaydet
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
