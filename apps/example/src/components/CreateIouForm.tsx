"use client";

import type { TemplateDescriptor } from "@nexus-framework/react";
import { Plus, RefreshCw, Send, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { nexus } from "../lib/nexus-client";

const IOU_TEMPLATE: TemplateDescriptor = {
	packageName: "nexus-example",
	moduleName: "Iou",
	entityName: "Iou",
};

type IouPayload = {
	amount: string;
	currency: string;
	owner: string;
};

export function CreateIouForm({ partyId: guestPartyId }: { partyId: string }) {
	const [amount, setAmount] = useState("");
	const [currency, setCurrency] = useState("USD");
	const [owner, setOwner] = useState("");

	const actAs = useMemo(() => [guestPartyId], [guestPartyId]);

	const { mutate, isPending, error } = nexus.useCreateContract<IouPayload>({
		waitForFinality: true,
		optimistic: (vars) => ({ payload: vars.createArguments }),
		onSuccess: () => {
			setAmount("");
			setOwner("");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!amount || !owner) return;

		mutate({
			templateId: IOU_TEMPLATE,
			createArguments: {
				amount,
				currency,
				owner,
			},
			actAs,
		});
	};

	return (
		<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
			<div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
				<Plus size={18} className="text-blue-500" />
				<h3 className="font-semibold text-slate-800 dark:text-slate-100">Issue New IOU</h3>
			</div>

			<form onSubmit={handleSubmit} className="p-6 space-y-4">
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-1.5">
							<label
								htmlFor="amount-input"
								className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
							>
								Amount
							</label>
							<div className="relative">
								<div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
									<WalletCards size={16} />
								</div>
								<input
									id="amount-input"
									type="number"
									required
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="0.00"
									className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="currency-input"
								className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
							>
								Currency
							</label>
							<select
								id="currency-input"
								value={currency}
								onChange={(e) => setCurrency(e.target.value)}
								className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none"
							>
								<option value="USD">USD - US Dollar</option>
								<option value="EUR">EUR - Euro</option>
								<option value="GBP">GBP - British Pound</option>
								<option value="DAML">DAML - Token</option>
							</select>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="owner-input"
								className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"
							>
								Target Owner (Party ID)
							</label>
							<input
								id="owner-input"
								type="text"
								required
								value={owner}
								onChange={(e) => setOwner(e.target.value)}
								placeholder="Alice::1220..."
								className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-mono text-xs"
							/>
						</div>
					</div>
				</div>

				{error && (
					<div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] font-medium leading-relaxed">
						Error: {error.message}
					</div>
				)}

				<button
					type="submit"
					disabled={isPending}
					className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
				>
					{isPending ? (
						<RefreshCw size={18} className="animate-spin" />
					) : (
						<>
							<Send
								size={18}
								className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
							/>
							<span>Confirm Transaction</span>
						</>
					)}
				</button>
			</form>
		</div>
	);
}
