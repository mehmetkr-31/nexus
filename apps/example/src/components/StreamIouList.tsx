"use client";

import type { ActiveContract } from "@nexus-framework/react";
import { Radio, RefreshCw, XCircle } from "lucide-react";
import { useMemo } from "react";
import { nexus } from "../lib/nexus-client";
import { IOU_TEMPLATE_ID } from "../lib/nexus";

interface IouPayload {
	owner: string;
	amount: string;
	currency: string;
}

export function StreamIouList({ partyId }: { partyId: string }) {
	const parties = useMemo(() => [partyId], [partyId]);

	const { contracts, isLive, error } = nexus.useStreamContracts<IouPayload>({
		templateId: IOU_TEMPLATE_ID,
		parties,
	});

	if (error) {
		return (
			<div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-8 rounded-2xl flex flex-col items-center gap-3 text-red-600 dark:text-red-400">
				<XCircle size={32} />
				<p className="text-sm font-bold">Streaming Disrupted</p>
				<p className="text-xs opacity-80 text-center">{error.message}</p>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
			<div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
				<div className="flex items-center gap-3">
					<div className="relative">
						<Radio size={18} className="text-emerald-500" />
						{isLive && (
							<span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
						)}
					</div>
					<h3 className="font-semibold text-slate-800 dark:text-slate-100">Live Ledger Events</h3>
				</div>
				<div className="flex items-center gap-2">
					{isLive ? (
						<span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
							<span className="w-1 h-1 bg-emerald-500 rounded-full" />
							Live
						</span>
					) : (
						<span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
							<RefreshCw size={10} className="animate-spin" />
							Syncing
						</span>
					)}
				</div>
			</div>

			<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-900/50">
				{contracts.length === 0 ? (
					<div className="p-24 text-center text-slate-400">
						<RefreshCw size={48} className="mx-auto mb-4 opacity-5 animate-spin-slow" />
						<p className="text-sm">Waiting for live events...</p>
					</div>
				) : (
					[...contracts].reverse().map((c: ActiveContract<IouPayload>) => (
						<div
							key={c.contractId}
							className="px-6 py-4 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 transition-all border-l-2 border-l-transparent hover:border-l-emerald-500 animate-in fade-in slide-in-from-left-2 duration-300"
						>
							<div className="min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<p className="text-sm font-bold text-slate-800 dark:text-slate-100">
										{c.payload.amount}
									</p>
									<span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
										{c.payload.currency}
									</span>
								</div>
								<p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
									ID: {c.contractId.slice(0, 16)}...
								</p>
							</div>
							<div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
								CREATE
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
