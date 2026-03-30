"use client";

import type { JwtPayload } from "@nexus-framework/core";
import { CheckCircle2, Globe, Key, Shield, User } from "lucide-react";
import { nexus } from "../lib/nexus-client";
import { GlassCard } from "./GlassCard";

interface NexusUser extends JwtPayload {
	iss?: string;
	sub?: string;
	exp?: number;
	"https://daml.com/ledger-api"?: {
		participantId: string;
		actAs: string[];
		readAs: string[];
		admin?: boolean;
	};
}

export function IdentityView() {
	const user = nexus.useUser() as NexusUser | null;
	const { actAs, readAs } = nexus.useParties();
	const { isAuthenticated, token } = nexus.useAuthStatus();

	const ledgerApi = user?.["https://daml.com/ledger-api"];

	return (
		<div className="p-6 lg:p-12 space-y-10 max-w-[1200px] mx-auto">
			<header className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="px-3 py-1 bg-brand-gradient rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none shadow-lg shadow-blue-500/20">
						Security
					</div>
					<h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none brand-text-gradient">
						Identity & Access
					</h1>
				</div>
				<p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
					Detailed breakdown of your session credentials, ledger permissions, and cryptographic
					identity.
				</p>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Status Card */}
				<GlassCard className="lg:col-span-2 flex flex-col justify-between min-h-[300px]">
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="w-14 h-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
								<Shield size={28} />
							</div>
							<div
								className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
									isAuthenticated
										? "bg-emerald-500/10 text-emerald-500"
										: "bg-red-500/10 text-red-500"
								}`}
							>
								{isAuthenticated ? <CheckCircle2 size={14} /> : null}
								{isAuthenticated ? "Session Active" : "No Session"}
							</div>
						</div>

						<div>
							<h3 className="text-3xl font-black tracking-tighter mb-2">
								{user?.sub || "Anonymous User"}
							</h3>
							<p className="text-slate-500 font-mono text-sm truncate max-w-md">
								{ledgerApi?.participantId || "Local Sandbox Node"}
							</p>
						</div>
					</div>

					<div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
								Expires In
							</p>
							<p className="font-bold text-sm">
								{user?.exp ? new Date(user.exp * 1000).toLocaleTimeString() : "Never"}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
								Issuer
							</p>
							<p className="font-bold text-sm truncate">{user?.iss || "Sandbox"}</p>
						</div>
					</div>
				</GlassCard>

				{/* Permissions Card */}
				<GlassCard className="flex flex-col gap-6">
					<div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
						<Key size={24} />
					</div>
					<div>
						<h4 className="text-lg font-black tracking-tight mb-4">Ledger Rights</h4>
						<div className="space-y-4">
							<div className="space-y-2">
								<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
									Act As
								</p>
								<div className="flex flex-wrap gap-2">
									{actAs.map((p) => (
										<span
											key={p}
											className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-mono font-bold"
										>
											{p.slice(0, 12)}...
										</span>
									))}
								</div>
							</div>
							<div className="space-y-2">
								<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
									Read As
								</p>
								<div className="flex flex-wrap gap-2">
									{readAs.map((p) => (
										<span
											key={p}
											className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-mono font-bold"
										>
											{p.slice(0, 12)}...
										</span>
									))}
								</div>
							</div>
						</div>
					</div>
				</GlassCard>
			</div>

			{/* JWT Details */}
			<div className="space-y-6">
				<div className="flex items-center justify-between px-2">
					<h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
						Raw Credentials
					</h2>
					<div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-6" />
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<GlassCard className="font-mono text-xs overflow-hidden">
						<div className="flex justify-between items-center mb-4">
							<span className="text-blue-500 font-black tracking-widest uppercase">
								Decoded Payload
							</span>
							<User size={14} className="text-slate-400" />
						</div>
						<pre className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-auto max-h-[400px]">
							{JSON.stringify(user, null, 2)}
						</pre>
					</GlassCard>

					<GlassCard className="font-mono text-xs overflow-hidden">
						<div className="flex justify-between items-center mb-4">
							<span className="text-purple-500 font-black tracking-widest uppercase">
								JWT Token
							</span>
							<Globe size={14} className="text-slate-400" />
						</div>
						<div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl break-all">
							{token || "No token available"}
						</div>
					</GlassCard>
				</div>
			</div>
		</div>
	);
}
