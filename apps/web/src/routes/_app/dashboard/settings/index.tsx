"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@nexus/ui/components/avatar";
import { Button } from "@nexus/ui/components/button";
import { Input } from "@nexus/ui/components/input";
import { Label } from "@nexus/ui/components/label";
import { Separator } from "@nexus/ui/components/separator";
import { Switch } from "@nexus/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { BellIcon, KeyRoundIcon, MonitorIcon, MoonIcon, PaletteIcon, UserIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/dashboard/settings/")({
	component: RouteComponent,
});

type SettingsTab = "profile" | "notifications" | "security" | "appearance";

interface NavItem {
	id: SettingsTab;
	label: string;
	icon: typeof UserIcon;
}

const navItems: NavItem[] = [
	{ id: "profile", label: "Profil", icon: UserIcon },
	{ id: "notifications", label: "Bildirimler", icon: BellIcon },
	{ id: "security", label: "Güvenlik", icon: KeyRoundIcon },
	{ id: "appearance", label: "Görünüm", icon: PaletteIcon },
];

function ProfileSettings() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-lg font-medium">Profil</h3>
				<p className="text-sm text-muted-foreground">Hesap bilgilerinizi güncelleyin.</p>
			</div>
			<div className="h-px bg-border" />
			<div className="flex flex-col items-center gap-6 sm:flex-row">
				<div className="relative">
					<Avatar className="h-24 w-24 rounded-full border-4 border-background">
						<AvatarImage src="/avatars/user.jpg" alt="Profile" />
						<AvatarFallback className="rounded-full text-xl">CN</AvatarFallback>
					</Avatar>
					<div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<title>Fotoğraf yükle</title>
							<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
							<line x1="18" y1="2" x2="22" y2="6" />
							<line x1="8" y1="14" x2="16" y2="14" />
						</svg>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<p className="text-sm text-muted-foreground">JPG, GIF veya PNG. Maksimum 1MB.</p>
					<Button variant="outline" size="sm">
						Fotoğraf Yükle
					</Button>
				</div>
			</div>
			<div className="grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="name">Ad Soyad</Label>
					<Input id="name" defaultValue="User Name" />
				</div>
				<div className="grid gap-2">
					<Label htmlFor="email">E-posta</Label>
					<Input id="email" type="email" defaultValue="user@example.com" />
				</div>
			</div>
			<Button>Değişiklikleri Kaydet</Button>
		</div>
	);
}

function NotificationSettings() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-lg font-medium">Bildirimler</h3>
				<p className="text-sm text-muted-foreground">Bildirim tercihlerinizi yönetin.</p>
			</div>
			<div className="h-px bg-border" />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">E-posta Bildirimleri</p>
						<p className="text-xs text-muted-foreground">
							Önemli güncellemeler hakkında e-posta alın.
						</p>
					</div>
					<Switch defaultChecked />
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">Döküman Bildirimleri</p>
						<p className="text-xs text-muted-foreground">
							İmza bekleyen dökümanlar hakkında bildirim alın.
						</p>
					</div>
					<Switch defaultChecked />
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">Aktivite Bildirimleri</p>
						<p className="text-xs text-muted-foreground">
							Hesap aktiviteleri hakkında bildirim alın.
						</p>
					</div>
					<Switch />
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">Pazarlama Bildirimleri</p>
						<p className="text-xs text-muted-foreground">
							Kampanyalar ve güncellemeler hakkında bildirim alın.
						</p>
					</div>
					<Switch />
				</div>
			</div>
		</div>
	);
}

function SecuritySettings() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-lg font-medium">Güvenlik</h3>
				<p className="text-sm text-muted-foreground">Hesap güvenliğinizi yönetin.</p>
			</div>
			<div className="h-px bg-border" />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">İki Faktörlü Kimlik Doğrulama</p>
						<p className="text-xs text-muted-foreground">Hesabınızı 2FA ile koruyun.</p>
					</div>
					<Switch />
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">Oturumları Hatırla</p>
						<p className="text-xs text-muted-foreground">Cihazlarda oturum açık kalsın.</p>
					</div>
					<Switch defaultChecked />
				</div>
			</div>
			<Separator />
			<div>
				<h4 className="text-sm font-medium mb-4">Şifre Değiştir</h4>
				<div className="grid gap-4 max-w-sm">
					<div className="grid gap-2">
						<Label htmlFor="current-password">Mevcut Şifre</Label>
						<Input id="current-password" type="password" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="new-password">Yeni Şifre</Label>
						<Input id="new-password" type="password" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="confirm-password">Şifre Tekrar</Label>
						<Input id="confirm-password" type="password" />
					</div>
				</div>
				<Button className="mt-4">Şifreyi Güncelle</Button>
			</div>
		</div>
	);
}

function AppearanceSettings() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h3 className="text-lg font-medium">Görünüm</h3>
				<p className="text-sm text-muted-foreground">Uygulamanın görünümünü özelleştirin.</p>
			</div>
			<div className="h-px bg-border" />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-md border">
							<MoonIcon className="size-4" />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium">Karanlık Mod</p>
							<p className="text-xs text-muted-foreground">Koyu tema kullanın.</p>
						</div>
					</div>
					<Switch />
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-md border">
							<MonitorIcon className="size-4" />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium">Sistem Temasını Takip Et</p>
							<p className="text-xs text-muted-foreground">Cihazınızın tema ayarını kullanın.</p>
						</div>
					</div>
					<Switch defaultChecked />
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

	const renderContent = () => {
		switch (activeTab) {
			case "profile":
				return <ProfileSettings />;
			case "notifications":
				return <NotificationSettings />;
			case "security":
				return <SecuritySettings />;
			case "appearance":
				return <AppearanceSettings />;
		}
	};

	return (
		<div className="flex flex-col gap-6 h-full">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
				<p className="text-muted-foreground">Hesap ayarlarınızı ve tercihlerinizi yönetin.</p>
			</div>
			<div className="flex flex-1 flex-col gap-6 md:flex-row">
				<aside className="w-full md:w-[220px] shrink-0">
					<nav className="flex flex-col gap-1">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = activeTab === item.id;
							return (
								<button
									type="button"
									key={item.id}
									onClick={() => setActiveTab(item.id)}
									className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
										isActive
											? "bg-primary text-primary-foreground shadow-sm"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									<Icon className="size-4" />
									{item.label}
								</button>
							);
						})}
					</nav>
				</aside>
				<div className="w-px bg-border mx-4 self-stretch" />
				<main className="flex-1">{renderContent()}</main>
			</div>
		</div>
	);
}
