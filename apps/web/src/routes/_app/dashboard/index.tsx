"use client";

import { Avatar, AvatarFallback } from "@nexus/ui/components/avatar";
import { Badge } from "@nexus/ui/components/badge";
import { Button } from "@nexus/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@nexus/ui/components/card";
import {
	ChartContainer,
	ChartLegendContent,
	ChartTooltipContent,
} from "@nexus/ui/components/chart";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@nexus/ui/components/dropdown-menu";
import { Separator } from "@nexus/ui/components/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@nexus/ui/components/table";
import { cn } from "@nexus/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
	ArrowRightIcon,
	CopyIcon,
	DownloadIcon,
	EyeIcon,
	FileTextIcon,
	MoreHorizontal,
	PenToolIcon,
	PlusIcon,
	RefreshCwIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	WalletIcon,
} from "lucide-react";
import * as RechartsPrimitive from "recharts";

import { StatCard } from "@/components/dashboard/stat-card";

export const Route = createFileRoute("/_app/dashboard/")({
	component: RouteComponent,
});

const chartConfig = {
	desktop: {
		label: "Desktop",
		theme: {
			light: "hsl(var(--chart-1))",
			dark: "hsl(var(--chart-1))",
		},
	},
	mobile: {
		label: "Mobile",
		theme: {
			light: "hsl(var(--chart-2))",
			dark: "hsl(var(--chart-2))",
		},
	},
};

const chartData = [
	{ month: "January", desktop: 186, mobile: 80 },
	{ month: "February", desktop: 305, mobile: 200 },
	{ month: "March", desktop: 237, mobile: 120 },
	{ month: "April", desktop: 73, mobile: 190 },
	{ month: "May", desktop: 209, mobile: 130 },
	{ month: "June", desktop: 214, mobile: 140 },
];

const pendingDocuments = [
	{
		id: "1",
		title: "Şirket Sözleşmesi",
		description: "Yıllık bakım anlaşması için imza gerekli",
		createdBy: "Ahmet Yılmaz",
		signedCount: 2,
		totalSigners: 5,
	},
	{
		id: "2",
		title: "Gizlilik Anlaşması",
		description: "Yeni çalışanlar için gizlilik sözleşmesi",
		createdBy: "Fatma Demir",
		signedCount: 4,
		totalSigners: 5,
	},
	{
		id: "3",
		title: "Satış Sözleşmesi",
		description: "Q4 dönemi satış hedefleri anlaşması",
		createdBy: "Mehmet Kaya",
		signedCount: 3,
		totalSigners: 5,
	},
];

const recentActivities = [
	{
		id: "1",
		status: "completed" as const,
		date: "2026-04-15",
		amount: "₺12,500.00",
		method: "Bank Transfer",
		description: "Invoice #1234 - Tech Solutions",
	},
	{
		id: "2",
		status: "pending" as const,
		date: "2026-04-15",
		amount: "₺8,750.00",
		method: "Crypto",
		description: "Invoice #1235 - Design Studio",
	},
	{
		id: "3",
		status: "failed" as const,
		date: "2026-04-14",
		amount: "₺25,000.00",
		method: "Credit Card",
		description: "Invoice #1236 - Marketing Agency",
	},
	{
		id: "4",
		status: "completed" as const,
		date: "2026-04-14",
		amount: "₺5,200.00",
		method: "Bank Transfer",
		description: "Invoice #1237 - Cloud Services",
	},
	{
		id: "5",
		status: "completed" as const,
		date: "2026-04-13",
		amount: "₺18,900.00",
		method: "Crypto",
		description: "Invoice #1238 - Consulting",
	},
];

const teamMembers = [
	{
		id: "1",
		name: "Ahmet Yılmaz",
		role: "Admin",
		lastActive: "2 dk önce",
		status: "online" as const,
		activity: "Invoice #1234 onayladı",
	},
	{
		id: "2",
		name: "Fatma Demir",
		role: "Editor",
		lastActive: "15 dk önce",
		status: "online" as const,
		activity: "Yeni sözleşme oluşturdu",
	},
	{
		id: "3",
		name: "Mehmet Kaya",
		role: "Viewer",
		lastActive: "1 saat önce",
		status: "away" as const,
		activity: "Doküman inceledi",
	},
	{
		id: "4",
		name: "Ayşe Şahin",
		role: "Editor",
		lastActive: "3 saat önce",
		status: "offline" as const,
		activity: "İmza bekleyen belgeleri gördü",
	},
	{
		id: "5",
		name: "Ali Özdemir",
		role: "Viewer",
		lastActive: "5 saat önce",
		status: "offline" as const,
		activity: "Rapor indirdi",
	},
];

const cryptoAssets = [
	{
		id: "cc",
		symbol: "CC",
		name: "Canton Coin",
		amount: "2500.0000",
		usdValue: 372.5,
		change: "+5.2%",
		positive: true,
		icon: "canton",
	},
	{
		id: "btc",
		symbol: "BTC",
		name: "Bitcoin",
		amount: "0.5234",
		usdValue: 35234.5,
		change: "+2.4%",
		positive: true,
		icon: "btc",
	},
	{
		id: "eth",
		symbol: "ETH",
		name: "Ethereum",
		amount: "4.2100",
		usdValue: 14735.0,
		change: "-1.2%",
		positive: false,
		icon: "eth",
	},
	{
		id: "usdt",
		symbol: "USDT",
		name: "Tether",
		amount: "12500.00",
		usdValue: 12500.0,
		change: "0.0%",
		positive: true,
		icon: "usdt",
	},
];

function CryptoIcon({ type }: { type: string }) {
	if (type === "canton") {
		return (
			<div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
				<svg
					viewBox="0 0 24 24"
					className="size-6 text-white"
					fill="currentColor"
					aria-label="Canton"
				>
					<path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18l7 3.89v7.86l-7 3.89-7-3.89V8.07l7-3.89zm0 2.32a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 2a3.5 3.5 0 110 7 3.5 3.5 0 010-7z" />
				</svg>
			</div>
		);
	}
	if (type === "btc") {
		return (
			<div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
				<svg
					viewBox="0 0 24 24"
					className="size-6 text-white"
					fill="currentColor"
					aria-label="Bitcoin"
				>
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13h-1v1h-1v1h1v1h1v-1h1v-1h-1v-1zm0 3h-1v1h1v1h-1v1h-1v-3h1v-1h1v1z" />
				</svg>
			</div>
		);
	}
	if (type === "eth") {
		return (
			<div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700">
				<svg
					viewBox="0 0 24 24"
					className="size-6 text-white"
					fill="currentColor"
					aria-label="Ethereum"
				>
					<path d="M12 2L4 12l8 5 8-5-8-10zm0 4.5L16.5 12 12 14.5 7.5 12 12 6.5zM4 14l8 5 8-5-8-5-8 5z" />
				</svg>
			</div>
		);
	}
	if (type === "usdt") {
		return (
			<div
				className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600"
				role="img"
				aria-label="Tether"
			>
				<span className="text-sm font-bold text-white">₮</span>
			</div>
		);
	}
	return null;
}

function StatCardItem({
	title,
	value,
	icon,
	trend,
	trendValue,
	className,
}: {
	title: string;
	value: string | number;
	icon: LucideIcon;
	trend?: "up" | "down" | null;
	trendValue?: string;
	className?: string;
}) {
	return (
		<StatCard
			title={title}
			value={value}
			icon={icon}
			trend={trend}
			trendValue={trendValue}
			className={className}
		/>
	);
}

function ProgressIndicator({ signed, total }: { signed: number; total: number }) {
	return (
		<div className="flex items-center gap-2">
			<div className="flex h-2 flex-1 gap-1">
				{Array.from({ length: total }).map((_, index) => (
					<div
						key={index}
						className={`flex-1 rounded-full ${index < signed ? "bg-primary" : "bg-muted"}`}
					/>
				))}
			</div>
			<span className="text-xs text-muted-foreground">
				{signed}/{total}
			</span>
		</div>
	);
}

function TransactionChart() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Transaction History</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[200px] w-full">
					<RechartsPrimitive.AreaChart data={chartData}>
						<RechartsPrimitive.XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 12 }}
							tickMargin={8}
						/>
						<RechartsPrimitive.YAxis
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 12 }}
							tickFormatter={(value) => `$${value}`}
						/>
						<RechartsPrimitive.Tooltip content={<ChartTooltipContent indicator="dot" />} />
						<RechartsPrimitive.CartesianGrid
							vertical={false}
							strokeDasharray="3 3"
							className="stroke-border/50"
						/>
						<RechartsPrimitive.Area
							type="monotone"
							dataKey="desktop"
							fill="hsl(var(--chart-1))"
							fillOpacity={0.4}
							stroke="hsl(var(--chart-1))"
							strokeWidth={2}
						/>
						<RechartsPrimitive.Area
							type="monotone"
							dataKey="mobile"
							fill="hsl(var(--chart-2))"
							fillOpacity={0.4}
							stroke="hsl(var(--chart-2))"
							strokeWidth={2}
						/>
						<ChartLegendContent />
					</RechartsPrimitive.AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

function PendingApprovalsCard() {
	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between">
						<CardTitle>İmza Bekleyenler</CardTitle>
						<Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto p-0">
							Detayı gör <ArrowRightIcon className="size-3" />
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">İmzalanmayı bekleyen belgeleri görüntüle</p>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{pendingDocuments.map((doc, index) => (
					<div key={doc.id} className="flex flex-col gap-3">
						<div className="flex flex-col gap-2">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									<FileTextIcon className="size-4 text-muted-foreground" />
									<span className="font-medium">{doc.title}</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-1 text-xs text-muted-foreground gap-1"
								>
									Detay gör
									<ArrowRightIcon className="size-3" />
								</Button>
							</div>
							<p className="text-sm text-muted-foreground">{doc.description}</p>
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">İmzalatmacı: {doc.createdBy}</span>
								<ProgressIndicator signed={doc.signedCount} total={doc.totalSigners} />
							</div>
							<div className="flex gap-1 text-center">
								{Array.from({ length: doc.totalSigners }).map((_, i) => (
									<div
										key={i}
										className={
											i < doc.signedCount
												? "rounded-lg w-full h-2 bg-foreground"
												: "rounded-lg w-full h-2 bg-muted"
										}
									/>
								))}
							</div>
						</div>
						{index < pendingDocuments.length - 1 && <Separator />}
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function CryptoAssetRow({
	symbol,
	name,
	amount,
	usdValue,
	change,
	positive,
	icon,
}: {
	symbol: string;
	name: string;
	amount: string;
	usdValue: number;
	change: string;
	positive: boolean;
	icon?: string;
}) {
	return (
		<div className="flex items-center justify-between py-3">
			<div className="flex items-center gap-3">
				<CryptoIcon type={icon || symbol.toLowerCase()} />
				<div>
					<p className="font-medium">{name}</p>
					<p className="text-xs text-muted-foreground">{symbol}</p>
				</div>
			</div>
			<div className="text-right">
				<p className="font-medium">
					{amount} {symbol}
				</p>
				<div className="flex items-center justify-end gap-2">
					<p className="text-xs text-muted-foreground">
						≈ $
						{usdValue.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
					<span
						className={cn(
							"text-xs font-medium",
							positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
						)}
					>
						{change}
					</span>
				</div>
			</div>
		</div>
	);
}

function AssetsCard() {
	const totalUsdValue = cryptoAssets.reduce((acc, asset) => acc + asset.usdValue, 0);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Varlıklarım</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="text-xs text-muted-foreground h-auto p-0 gap-1"
					>
						Detayı gör
						<ArrowRightIcon className="size-3" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col">
				{cryptoAssets.map((asset, index) => (
					<div key={asset.id}>
						<CryptoAssetRow {...asset} />
						{index < cryptoAssets.length - 1 && <Separator />}
					</div>
				))}
				<Separator className="my-2" />
				<div className="flex items-center justify-between pt-2">
					<p className="text-sm font-medium text-muted-foreground">Toplam Portföy</p>
					<p className="text-lg font-bold">
						$
						{totalUsdValue.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function RecentActivityCard() {
	const getStatusBadge = (status: "completed" | "pending" | "failed") => {
		switch (status) {
			case "completed":
				return (
					<Badge
						variant="default"
						className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
					>
						Tamamlandı
					</Badge>
				);
			case "pending":
				return (
					<Badge
						variant="secondary"
						className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20"
					>
						Bekliyor
					</Badge>
				);
			case "failed":
				return (
					<Badge
						variant="destructive"
						className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
					>
						Başarısız
					</Badge>
				);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Son Aktiviteler</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="text-xs text-muted-foreground h-auto p-0 gap-1"
					>
						Detayı gör
						<ArrowRightIcon className="size-3" />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Status</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Method</TableHead>
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{recentActivities.map((activity) => (
							<TableRow key={activity.id}>
								<TableCell>{getStatusBadge(activity.status)}</TableCell>
								<TableCell className="text-muted-foreground">{activity.date}</TableCell>
								<TableCell className="font-medium">{activity.amount}</TableCell>
								<TableCell className="text-muted-foreground">{activity.method}</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="size-8">
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuItem>
												<EyeIcon className="size-4 mr-2" />
												Detay gör
											</DropdownMenuItem>
											<DropdownMenuItem>
												<CopyIcon className="size-4 mr-2" />
												Fatura kopyala
											</DropdownMenuItem>
											<DropdownMenuItem>
												<DownloadIcon className="size-4 mr-2" />
												İndir
											</DropdownMenuItem>
											{activity.status === "failed" && (
												<>
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-destructive focus:text-destructive">
														<RefreshCwIcon className="size-4 mr-2" />
														Yeniden dene
													</DropdownMenuItem>
												</>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

function QuickActionsCard() {
	return (
		<div className="flex flex-wrap gap-3">
			<Button size="sm" variant="default">
				<PlusIcon className="size-4 mr-2" />
				Yeni işlem oluştur
			</Button>
			<Button size="sm" variant="outline">
				<PenToolIcon className="size-4 mr-2" />
				İmza at
			</Button>
		</div>
	);
}

function TeamActivityCard() {
	const onlineCount = teamMembers.filter((m) => m.status === "online").length;
	const pendingTasks = 3;

	const getStatusColor = (status: string) => {
		switch (status) {
			case "online":
				return "bg-green-500";
			case "away":
				return "bg-yellow-500";
			case "offline":
				return "bg-gray-400";
			default:
				return "bg-gray-400";
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Team Activity Snapshot</CardTitle>
					<Button
						variant="ghost"
						size="sm"
						className="text-xs text-muted-foreground h-auto p-0 gap-1"
					>
						Detayı gör
						<ArrowRightIcon className="size-3" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="grid grid-cols-3 gap-4">
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
						<p className="text-2xl font-bold">{teamMembers.length}</p>
						<p className="text-xs text-muted-foreground">Toplam Üye</p>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-green-500/10 p-3">
						<p className="text-2xl font-bold text-green-600 dark:text-green-400">{onlineCount}</p>
						<p className="text-xs text-muted-foreground">Aktif Şimdi</p>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-yellow-500/10 p-3">
						<p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
							{pendingTasks}
						</p>
						<p className="text-xs text-muted-foreground">Bekleyen Görev</p>
					</div>
				</div>
				<Separator />
				<div className="flex flex-col gap-3">
					{teamMembers.slice(0, 5).map((member) => (
						<div key={member.id} className="flex items-center gap-3">
							<div className="relative">
								<Avatar className="size-8">
									<AvatarFallback className="bg-primary/10 text-xs">
										{getInitials(member.name)}
									</AvatarFallback>
								</Avatar>
								<div
									className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background ${getStatusColor(member.status)}`}
								/>
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="truncate text-sm font-medium">{member.name}</p>
									<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
										{member.role}
									</Badge>
								</div>
								<p className="truncate text-xs text-muted-foreground">{member.activity}</p>
							</div>
							<p className="text-xs text-muted-foreground whitespace-nowrap">{member.lastActive}</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function RouteComponent() {
	return (
		<div className="flex flex-col gap-6">
			<QuickActionsCard />

			<div className="grid gap-4 md:grid-cols-3">
				<StatCardItem
					title="Total Balance"
					value="$125,000.00"
					icon={WalletIcon}
					trend="up"
					trendValue="+12.5%"
				/>
				<StatCardItem
					title="Income"
					value="$45,000.00"
					icon={TrendingUpIcon}
					trend="up"
					trendValue="+8.2%"
				/>
				<StatCardItem
					title="Expenses"
					value="$12,450.00"
					icon={TrendingDownIcon}
					trend="down"
					trendValue="-3.1%"
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
				<div className="flex flex-col gap-6">
					<AssetsCard />
					<PendingApprovalsCard />
				</div>
				<div className="flex flex-col gap-6">
					<TransactionChart />
					<TeamActivityCard />
				</div>
			</div>

			<RecentActivityCard />
		</div>
	);
}
