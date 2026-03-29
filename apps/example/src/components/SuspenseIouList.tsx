"use client";

import type { ActiveContract } from "@nexus-framework/react";
import { Layers, Loader2, Target } from "lucide-react";
import { Suspense, useMemo } from "react";
import { nexus } from "../lib/nexus-client";

interface IouPayload {
	owner: string;
	amount: string;
	currency: string;
}

const IOU_TEMPLATE_ID = "nexus-example:Iou:Iou";

export function SuspenseIouList({ partyId }: { partyId: string }) {
	return (
		<Suspense fallback={<SuspenseLoader />}>
			<IouListInner partyId={partyId} />
		</Suspense>
	);
}

function SuspenseLoader() {
	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center p-24 text-slate-400">
			<div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-4">
				<Loader2 size={24} className="animate-spin text-emerald-500 stroke-3" />
			</div>
			<p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">
				Suspending...
			</p>
			<p className="text-xs opacity-60">Waiting for Ledger hydration</p>
		</div>
	);
}

function IouListInner({ partyId }: { partyId: string }) {
	const parties = useMemo(() => [partyId], [partyId]);

	const { data } = nexus.useContractsSuspense<IouPayload>({
		templateId: IOU_TEMPLATE_ID,
		parties,
	});

	const contracts = data?.contracts ?? [];

	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px] border-l-4 border-l-emerald-500/50">
			<div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
				<h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
					<Layers size={18} className="text-emerald-500" />
					Suspense List ({contracts.length})
				</h3>
				<span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
					Hydrated
				</span>
			</div>

			<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-auto bg-emerald-50/5 dark:bg-emerald-900/5 custom-scrollbar">
				{contracts.length === 0 ? (
					<div className="p-24 text-center text-slate-400">
						<Layers size={48} className="mx-auto mb-4 opacity-10" />
						<p className="text-sm">No data available.</p>
					</div>
				) : (
					contracts.map((c: ActiveContract<IouPayload>) => (
						<SuspenseRow key={c.contractId} contract={c} />
					))
				)}
			</div>
		</div>
	);
}

function SuspenseRow({ contract }: { contract: ActiveContract<IouPayload> }) {
	return (
		<div className="px-6 py-5 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/80 transition-all group border-b border-transparent hover:border-emerald-100 dark:hover:border-emerald-900">
			<div className="flex gap-4 items-center min-w-0">
				<div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
					IOU
				</div>
				<div className="min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">
							{contract.payload.amount}
						</p>
						<p className="text-xs font-bold text-slate-400 uppercase">
							{contract.payload.currency}
						</p>
					</div>
					<div className="flex items-center gap-1.5 h-3 text-[10px]">
						<Target size={10} className="text-slate-300" />
						<p className="text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
							{contract.payload.owner}
						</p>
					</div>
				</div>
			</div>

			<div className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-600 opacity-20 group-hover:opacity-100 transition-opacity" />
		</div>
	);
}
