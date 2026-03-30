"use client";

import { AnimatePresence } from "framer-motion";
import { Box, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { nexus } from "../lib/nexus-client";
import { GlassCard } from "./GlassCard";

export function PackageExplorer() {
	const [templates, setTemplates] = useState<Record<string, string>>({});
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadTemplates = async () => {
			setIsLoading(true);
			try {
				// Ensure packages are initialized
				if (nexus.packages) {
					await nexus.packages.init();
					setTemplates(nexus.packages.getAllTemplates());
				}
			} catch (err) {
				console.error("Failed to load templates:", err);
			} finally {
				setIsLoading(false);
			}
		};
		loadTemplates();
	}, []);

	const filteredTemplates = Object.entries(templates).filter(([key]) =>
		key.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="p-6 lg:p-12 space-y-10 max-w-[1200px] mx-auto">
			<header className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="px-3 py-1 bg-brand-gradient rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none shadow-lg shadow-blue-500/20">
						Discovery
					</div>
					<h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none brand-text-gradient">
						Package Explorer
					</h1>
				</div>
				<p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
					Browse and interact with all contract templates discovered on the connected Canton node.
				</p>
			</header>

			<div className="relative group">
				<Search
					className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
					size={20}
				/>
				<input
					type="text"
					placeholder="Search templates (e.g. Iou, Asset, Token)..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full pl-14 pr-6 py-5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-lg"
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{isLoading ? (
					[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse"
						/>
					))
				) : (
					<AnimatePresence mode="popLayout">
						{filteredTemplates.length > 0 ? (
							filteredTemplates.map(([name, id], idx) => {
								const [pkg, mod, entity] = name.split(":");
								return (
									<GlassCard key={id} delay={idx * 0.05} className="group cursor-pointer">
										<div className="flex justify-between items-start mb-6">
											<div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
												<Box size={24} />
											</div>
											<div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
												Template
											</div>
										</div>

										<div className="space-y-2">
											<h3 className="text-2xl font-black tracking-tighter group-hover:brand-text-gradient transition-all">
												{entity}
											</h3>
											<p className="text-sm font-bold text-slate-400">{mod}</p>
										</div>

										<div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
											<code className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
												{pkg}
											</code>
											<div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
												Quick Launch <ChevronRight size={14} />
											</div>
										</div>
									</GlassCard>
								);
							})
						) : (
							<div className="col-span-full py-20 text-center space-y-4">
								<div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto opacity-50">
									<Search size={32} className="text-slate-400" />
								</div>
								<h3 className="text-xl font-bold">No templates found</h3>
								<p className="text-slate-500 text-sm">
									Try adjusting your search or sync the ledger.
								</p>
							</div>
						)}
					</AnimatePresence>
				)}
			</div>
		</div>
	);
}
