"use client";

import { motion } from "framer-motion";
import {
	Activity,
	ChevronRight,
	Database,
	Fingerprint,
	LayoutDashboard,
	Search,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ name: "Dashboard", icon: LayoutDashboard, href: "/contracts" },
	{ name: "Explorer", icon: Search, href: "/explorer" },
	{ name: "Identity", icon: Fingerprint, href: "/identity" },
	{ name: "Activity", icon: Activity, href: "/history" },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="w-72 hidden lg:flex flex-col h-screen fixed left-0 top-0 glass border-r-0 z-50 p-6 gap-8">
			<div className="flex items-center gap-3 px-2">
				<div className="w-10 h-10 rounded-2xl bg-brand-gradient p-2 flex items-center justify-center shadow-lg shadow-blue-500/20">
					<Database className="text-white" size={24} />
				</div>
				<div>
					<h2 className="font-black tracking-tighter text-lg leading-tight">Nexus</h2>
					<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
						Playground
					</p>
				</div>
			</div>

			<nav className="flex-1 space-y-2">
				{navItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link key={item.name} href={item.href}>
							<motion.div
								whileHover={{ x: 4 }}
								whileTap={{ scale: 0.98 }}
								className={`
									flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 group
									${
										isActive
											? "bg-brand-gradient text-white shadow-lg shadow-blue-500/20"
											: "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400"
									}
								`}
							>
								<div className="flex items-center gap-3">
									<item.icon
										size={20}
										className={
											isActive ? "text-white" : "group-hover:text-blue-500 transition-colors"
										}
									/>
									<span className="font-bold text-sm tracking-tight">{item.name}</span>
								</div>
								{isActive && (
									<motion.div layoutId="active-pill">
										<ChevronRight size={16} />
									</motion.div>
								)}
							</motion.div>
						</Link>
					);
				})}
			</nav>

			<div className="space-y-4">
				<div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
						System Status
					</p>
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
						<span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-tight">
							Canton Live
						</span>
					</div>
				</div>

				<button
					type="button"
					className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-bold text-sm"
				>
					<Settings size={20} />
					<span>Settings</span>
				</button>
			</div>
		</aside>
	);
}
