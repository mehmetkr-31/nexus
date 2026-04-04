"use client";

import { Iou } from "@daml.js/nexus-example-0.0.1";
import type { ActiveContract } from "@nexus-framework/react";
import { Clock, Trash2, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { nexus } from "../lib/nexus-client";

type IouPayload = Iou.Iou;

export function IouList({ partyId }: { partyId: string }) {
	const parties = useMemo(() => [partyId], [partyId]);

	const { data, isLoading } = useQuery(nexus.Iou.query.contracts({ parties }));
	const contracts = data?.contracts ?? [];

	if (isLoading) {
		return (
			<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col items-center justify-center p-12 text-slate-400">
				<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
				<p className="text-sm font-medium">Crunching ledger data...</p>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
			<div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
				<h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
					<Wallet size={18} className="text-blue-500" />
					Inventory ({contracts.length})
				</h3>
				<span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
					Polling
				</span>
			</div>

			<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-auto">
				{contracts.length === 0 ? (
					<div className="p-24 text-center text-slate-400">
						<Wallet size={48} className="mx-auto mb-4 opacity-10" />
						<p className="text-sm">No active IOU contracts found.</p>
					</div>
				) : (
					contracts.map((c: ActiveContract<IouPayload>) => (
						<IouRow key={c.contractId} contract={c} guestPartyId={partyId} />
					))
				)}
			</div>
		</div>
	);
}

function IouRow({
	contract,
	guestPartyId,
}: {
	contract: ActiveContract<IouPayload>;
	guestPartyId: string;
}) {
	const { mutate, isPending } = nexus.Iou.useExercise(Iou.Iou.Archive, { optimistic: true });

	const handleArchive = () => {
		mutate({
			contractId: contract.contractId,
			choiceArgument: {},
			actAs: [contract.signatories[0] ?? guestPartyId],
		});
	};

	return (
		<div
			className={`px-6 py-5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group ${
				contract.isOptimistic ? "opacity-50 cursor-wait" : ""
			}`}
		>
			<div className="flex gap-4 items-center min-w-0">
				<div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:text-blue-500 transition-all duration-300">
					<span className="text-sm font-bold tracking-tighter">
						{contract.payload.currency.slice(0, 3)}
					</span>
				</div>
				<div className="min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<p className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
							{contract.payload.amount}
						</p>
						<span className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded leading-none uppercase tracking-wide">
							{contract.payload.currency}
						</span>
						{contract.isOptimistic && (
							<span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
								<Clock size={10} />
								Processing...
							</span>
						)}
					</div>
					<p
						className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[180px]"
						title={contract.payload.owner}
					>
						{contract.payload.owner}
					</p>
				</div>
			</div>

			<button
				type="button"
				onClick={handleArchive}
				disabled={isPending}
				className="p-2.5 text-slate-300 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
				title="Archive Contract"
			>
				{isPending ? (
					<div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
				) : (
					<Trash2 size={20} />
				)}
			</button>
		</div>
	);
}
