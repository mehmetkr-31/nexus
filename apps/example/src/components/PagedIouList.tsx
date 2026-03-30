"use client";

import type { ActiveContract, TemplateDescriptor } from "@nexus-framework/react";
import { Loader2, Plus, Wallet } from "lucide-react";
import { useMemo } from "react";
import { nexus } from "../lib/nexus-client";

type IouPayload = {
	owner: string;
	amount: string;
	currency: string;
};

const IOU_TEMPLATE: TemplateDescriptor = {
	packageName: "nexus-example",
	moduleName: "Iou",
	entityName: "Iou",
};

export function PagedIouList({ partyId }: { partyId: string }) {
	const parties = useMemo(() => [partyId], [partyId]);

	const {
		contracts: allContracts,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = nexus.usePagedContracts<IouPayload>({
		templateId: IOU_TEMPLATE,
		parties,
		pageSize: 5,
	});

	if (isLoading) {
		return (
			<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center text-slate-400">
				<Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
				<p className="text-sm font-medium tracking-tight">Loading paged data...</p>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
			{/* Header */}
			<div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
				<h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
					<Wallet size={18} className="text-indigo-500" />
					Paged Inventory ({allContracts.length})
				</h3>
				<div className="flex items-center gap-2">
					{isFetchingNextPage && <Loader2 size={14} className="animate-spin text-slate-400" />}
					<span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
						Cursor-based
					</span>
				</div>
			</div>

			{/* List Body */}
			<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-auto max-h-[500px]">
				{allContracts.length === 0 ? (
					<div className="p-24 text-center text-slate-400">
						<Wallet size={48} className="mx-auto mb-4 opacity-10" />
						<p className="text-sm">No paged contracts found.</p>
					</div>
				) : (
					allContracts.map((c: ActiveContract<IouPayload>) => (
						<div
							key={c.contractId}
							className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group"
						>
							<div className="flex items-center gap-4">
								<div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
									{c.payload.currency.slice(0, 3)}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<p className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">
											{c.payload.amount}
										</p>
										<span className="text-[10px] text-indigo-500 font-bold uppercase">
											{c.payload.currency}
										</span>
									</div>
									<p
										className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]"
										title={c.contractId}
									>
										{c.contractId}
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
									{new Date(c.createdAt).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</div>
					))
				)}
			</div>

			{/* Load More Button */}
			{hasNextPage && (
				<div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
					<button
						type="button"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-sm"
					>
						{isFetchingNextPage ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Plus size={16} />
						)}
						FETCH NEXT PAGE
					</button>
				</div>
			)}
		</div>
	);
}
