"use client";
import { LayoutGroup, motion } from "framer-motion";
import { Activity, Sparkles, Wallet } from "lucide-react";
import { CreateIouForm } from "./CreateIouForm";
import { GlassCard } from "./GlassCard";
import { IouList } from "./IouList";
import { LedgerStatus } from "./LedgerStatus";
import { PagedIouList } from "./PagedIouList";
import { SeedDataButton } from "./SeedDataButton";
import { StreamIouList } from "./StreamIouList";
import { UserInfo } from "./UserInfo";

export function DashboardView({ partyId }: { partyId: string }) {
	return (
		<div className="p-6 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
			{/* Page Header */}
			<header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
				<div className="space-y-4">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-3"
					>
						<div className="px-3 py-1 bg-brand-gradient rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none shadow-lg shadow-blue-500/20">
							Active Session
						</div>
						<h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none brand-text-gradient">
							Nexus Dashboard
						</h1>
					</motion.div>
					<p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
						Real-time ledger overview. Monitor your IOUs and system health.
					</p>
				</div>
			</header>

			{/* Top Stats Row */}
			<LayoutGroup>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<GlassCard delay={0.1} className="flex items-center gap-5">
						<div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
							<Wallet size={24} />
						</div>
						<div>
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
								Live Contracts
							</p>
							<p className="text-2xl font-black tracking-tighter">Active</p>
						</div>
					</GlassCard>

					<GlassCard delay={0.2} className="flex items-center gap-5">
						<div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
							<Activity size={24} />
						</div>
						<div>
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
								Network Load
							</p>
							<p className="text-2xl font-black tracking-tighter">Nominal</p>
						</div>
					</GlassCard>

					<GlassCard delay={0.3} className="flex items-center gap-5">
						<div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
							<Sparkles size={24} />
						</div>
						<div>
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
								Gas Status
							</p>
							<p className="text-2xl font-black tracking-tighter">Optimized</p>
						</div>
					</GlassCard>
				</div>

				<LedgerStatus partyId={partyId} />

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
					<div className="space-y-10">
						<div className="space-y-6">
							<div className="flex items-center justify-between px-2">
								<h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
									Primary Inventory
								</h2>
								<div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-6" />
							</div>

							<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
								<IouList partyId={partyId} />
								<StreamIouList partyId={partyId} />
							</div>
						</div>

						<div className="space-y-6">
							<div className="flex items-center justify-between px-2">
								<h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
									Secondary Buffers
								</h2>
								<div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-6" />
							</div>
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
								<PagedIouList partyId={partyId} />
								<GlassCard className="flex flex-col items-center justify-center text-center p-12 text-slate-400 border-dashed border-2 bg-transparent">
									<Sparkles size={48} className="mb-4 opacity-10" />
									<p className="text-sm font-bold">New View Slots Available</p>
									<p className="text-xs">Add more data streams in settings</p>
								</GlassCard>
							</div>
						</div>
					</div>

					{/* Sidebar Actions */}
					<aside className="space-y-8">
						<SeedDataButton partyId={partyId} />
						<UserInfo />
						<CreateIouForm partyId={partyId} />

						<GlassCard className="bg-slate-900 border-slate-800 text-slate-400">
							<p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
								Playground Info
							</p>
							<div className="space-y-3 text-xs leading-relaxed font-medium">
								<p>
									<span className="text-white">Node:</span> {partyId.slice(0, 24)}...
								</p>
								<p>
									<span className="text-white">Mode:</span> Development
								</p>
							</div>
						</GlassCard>
					</aside>
				</div>
			</LayoutGroup>
		</div>
	);
}
