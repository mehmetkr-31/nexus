"use client";

import { Button } from "@nexus/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@nexus/ui/components/card";
import {
	ChartContainer,
	ChartLegendContent,
	ChartTooltipContent,
} from "@nexus/ui/components/chart";
import { Separator } from "@nexus/ui/components/separator";
import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { FileTextIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from "lucide-react";
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
						<span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
							{pendingDocuments.length}
						</span>
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
									className="h-auto p-1 text-xs text-muted-foreground"
								>
									Detay gör
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

function RouteComponent() {
	return (
		<div className="flex flex-col gap-6">
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
				<PendingApprovalsCard />
				<TransactionChart />
			</div>
		</div>
	);
}
