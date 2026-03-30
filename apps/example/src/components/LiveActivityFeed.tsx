"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Clock, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { nexus } from "../lib/nexus-client";
import { GlassCard } from "./GlassCard";

interface TimelineEvent {
	id: string;
	type: "created" | "archived";
	template: string;
	timestamp: Date;
	payload?: Record<string, unknown>;
}

export function LiveActivityFeed({ partyId }: { partyId: string }) {
	const parties = useMemo(() => [partyId], [partyId]);
	const [events, setEvents] = useState<TimelineEvent[]>([]);

	// Fallback: Using useStreamContracts for one template but with an "Event" capture logic
	const iouStream = nexus.useStreamContracts({
		templateId: "nexus-example:Iou:Iou",
		parties,
		onLive: () => {
			console.log("Stream is live!");
		},
	});

	// Capture events from the stream
	useEffect(() => {
		if (iouStream.contracts.length > 0) {
			const latest = iouStream.contracts[iouStream.contracts.length - 1];
			if (latest && !events.some((e) => e.id === latest.contractId)) {
				const newEvent: TimelineEvent = {
					id: latest.contractId,
					type: "created",
					template: "Iou",
					timestamp: new Date(),
					payload: latest.payload as Record<string, unknown>,
				};
				setEvents((prev) => [newEvent, ...prev].slice(0, 50));
			}
		}
	}, [iouStream.contracts, events]);

	return (
		<div className="p-6 lg:p-12 space-y-10 max-w-[1000px] mx-auto">
			<header className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="px-3 py-1 bg-brand-gradient rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none shadow-lg shadow-blue-500/20">
						Real-time
					</div>
					<h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none brand-text-gradient">
						Ledger History
					</h1>
				</div>
				<p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
					A live, streaming buffer of all events occurring on the connected synchronized ledger.
				</p>
			</header>

			<div className="space-y-4">
				<div className="flex items-center justify-between px-4 py-2 bg-blue-500/5 rounded-2xl border border-blue-500/10">
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full ${iouStream.connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
						/>
						<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
							{iouStream.connected ? "Multi-Stream Connected" : "Connection Lost"}
						</span>
					</div>
					<span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
						Buffer Limit: 50 Events
					</span>
				</div>

				<div className="space-y-4 relative">
					{/* Sidebar Line */}
					<div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 -z-10" />

					<AnimatePresence initial={false}>
						{events.length > 0 ? (
							events.map((event) => (
								<motion.div
									key={event.id + event.timestamp.getTime()}
									initial={{ opacity: 0, x: -20, scale: 0.95 }}
									animate={{ opacity: 1, x: 0, scale: 1 }}
									exit={{ opacity: 0, scale: 0.95 }}
									layout
								>
									<GlassCard className="p-0! overflow-hidden ml-4">
										<div className="flex items-stretch">
											<div
												className={`w-1.5 ${event.type === "created" ? "bg-emerald-500" : "bg-rose-500"}`}
											/>
											<div className="p-5 flex-1 flex items-center justify-between gap-6">
												<div className="flex items-center gap-5">
													<div
														className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
															event.type === "created"
																? "bg-emerald-500/10 text-emerald-500"
																: "bg-rose-500/10 text-rose-500"
														}`}
													>
														{event.type === "created" ? <Plus size={20} /> : <Trash2 size={20} />}
													</div>
													<div>
														<div className="flex items-center gap-2 mb-1">
															<span className="text-sm font-black tracking-tight">
																{event.template}
															</span>
															<span
																className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
																	event.type === "created"
																		? "bg-emerald-500/10 text-emerald-500"
																		: "bg-rose-500/10 text-rose-500"
																}`}
															>
																{event.type}
															</span>
														</div>
														<p className="text-[10px] font-mono text-slate-400 break-all max-w-[300px]">
															ID: {event.id}
														</p>
													</div>
												</div>

												<div className="text-right shrink-0">
													<p className="text-xs font-bold flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
														<Clock size={12} />
														{event.timestamp.toLocaleTimeString()}
													</p>
													{event.payload && (
														<p className="text-[10px] font-black text-blue-500 mt-1 uppercase tracking-widest">
															{String(event.payload.amount)} {String(event.payload.currency)}
														</p>
													)}
												</div>
											</div>
										</div>
									</GlassCard>
								</motion.div>
							))
						) : (
							<div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
								<Activity size={48} className="mb-4 animate-pulse" />
								<p className="font-bold">Awaiting ledger events...</p>
								<p className="text-xs">Create a contract to see it appear here in real-time.</p>
							</div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
