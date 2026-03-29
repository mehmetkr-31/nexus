"use client";

import { nexus } from "../lib/nexus-client";

export function UserInfo() {
	const user = nexus.useUser();
	const { actAs, readAs } = nexus.useParties();
	const { isAuthenticated } = nexus.useAuthStatus();

	if (!isAuthenticated) {
		return (
			<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest">
				Not Authenticated
			</div>
		);
	}

	return (
		<div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
					Identity Information
				</p>
				<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
			</div>

			<div className="space-y-4">
				<div>
					<p className="text-[10px] font-bold text-slate-500 uppercase mb-1">User ID (Sub)</p>
					<p className="text-sm font-black text-slate-900 dark:text-white truncate">
						{user?.sub ?? "Anonymous"}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-[10px] font-bold text-slate-500 uppercase mb-1 text-blue-500">
							Act As
						</p>
						<div className="space-y-1">
							{actAs.map((p) => (
								<p
									key={p}
									className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate"
								>
									{p.split("::")[0]}
								</p>
							))}
						</div>
					</div>
					<div>
						<p className="text-[10px] font-bold text-slate-500 uppercase mb-1 text-indigo-500">
							Read As
						</p>
						<div className="space-y-1">
							{readAs.map((p) => (
								<p
									key={p}
									className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate"
								>
									{p.split("::")[0]}
								</p>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
