"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Database, Users } from "lucide-react";
import { NEXUS_USER_ID, nexus } from "../lib/nexus-client";

export function LedgerStatus({ partyId: initialPartyId }: { partyId: string }) {
	const { data: resolvedPartyId } = useQuery(nexus.query!.partyId({ userId: NEXUS_USER_ID }));
	const partyId = resolvedPartyId ?? initialPartyId;
	const { data: ledgerEnd } = useQuery(nexus.query!.ledgerEnd());
	const { data: synchronizers } = useQuery(nexus.query!.synchronizers());

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div className="bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 group">
				<div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform tracking-widest">
					<Users size={22} />
				</div>
				<div className="min-w-0">
					<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
						Current Party
					</p>
					<p
						className="text-sm font-mono font-medium truncate text-slate-700 dark:text-slate-300"
						title={partyId}
					>
						{partyId?.split("::")[0] ?? "Resolving..."}
						<span className="text-slate-400 font-normal">
							::
							{partyId?.split("::")[1]?.slice(0, 8)}...
						</span>
					</p>
				</div>
			</div>

			<div className="bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900 group">
				<div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform tracking-widest">
					<Activity size={22} />
				</div>
				<div>
					<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
						Ledger End
					</p>
					<p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
						{ledgerEnd?.offset ?? "..."}
					</p>
				</div>
			</div>

			<div className="bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900 group">
				<div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform tracking-widest">
					<Database size={22} />
				</div>
				<div>
					<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
						Synchronizers
					</p>
					<p className="text-sm font-bold text-slate-700 dark:text-slate-300">
						{synchronizers?.length ?? 0}{" "}
						<span className="font-medium text-slate-500">Connected</span>
					</p>
				</div>
			</div>
		</div>
	);
}
