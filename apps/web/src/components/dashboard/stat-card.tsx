"use client";

import { cn } from "@nexus/ui/lib/utils";
import { type LucideIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	trend?: "up" | "down" | null;
	trendValue?: string;
	className?: string;
}

export function StatCard({
	title,
	value,
	icon: Icon,
	trend,
	trendValue,
	className,
}: StatCardProps) {
	return (
		<div className={cn("flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-xs", className)}>
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted-foreground">{title}</span>
				<div className="flex size-8 items-center justify-center rounded-lg bg-muted">
					<Icon className="size-4 text-muted-foreground" />
				</div>
			</div>
			<div className="flex items-end justify-between">
				<span className="text-2xl font-semibold tabular-nums">{value}</span>
				{trend && trendValue && (
					<div
						className={cn(
							"flex items-center gap-1 text-xs font-medium",
							trend === "up"
								? "text-green-600 dark:text-green-400"
								: "text-red-600 dark:text-red-400",
						)}
					>
						{trend === "up" ? (
							<TrendingUpIcon className="size-3" />
						) : (
							<TrendingDownIcon className="size-3" />
						)}
						{trendValue}
					</div>
				)}
			</div>
		</div>
	);
}
