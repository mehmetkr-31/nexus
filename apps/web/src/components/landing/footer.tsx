import { BookOpenText, Github, MessageCircle, ShieldCheck } from "lucide-react";

import Dock from "@/components/Dock";
import GradientText from "@/components/GradientText";

const open = (url: string) => () => window.open(url, "_blank", "noopener,noreferrer");

export function LandingFooter() {
	return (
		<footer id="footer" className="border-t border-slate-800/80 bg-slate-950 px-6 pb-24 pt-16">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
				<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
					<div>
						<GradientText className="text-3xl font-semibold tracking-wide" animationSpeed={7}>
							NEXUS
						</GradientText>
						<p className="mt-3 max-w-md text-sm text-slate-400">
							Canton Network icin tasarlanmis kurumsal multi-signature platformu.
						</p>
					</div>

					<div className="h-20 min-w-[330px]">
						<Dock
							items={[
								{ icon: <Github size={18} />, label: "GitHub", onClick: open("https://github.com") },
								{ icon: <BookOpenText size={18} />, label: "Docs", onClick: open("https://docs.canton.network") },
								{ icon: <MessageCircle size={18} />, label: "Community", onClick: open("https://discord.com") },
								{ icon: <ShieldCheck size={18} />, label: "Security", onClick: open("https://canton.network") },
							]}
							baseItemSize={48}
						/>
					</div>
				</div>

				<div className="grid gap-8 border-t border-slate-800/60 pt-8 sm:grid-cols-3">
					<div className="space-y-2 text-sm text-slate-400">
						<p className="font-medium text-slate-200">Product</p>
						<a href="#features" className="block hover:text-slate-100">
							Features
						</a>
						<a href="#how-it-works" className="block hover:text-slate-100">
							How it works
						</a>
						<a href="#use-cases" className="block hover:text-slate-100">
							Use cases
						</a>
					</div>
					<div className="space-y-2 text-sm text-slate-400">
						<p className="font-medium text-slate-200">Resources</p>
						<a href="https://docs.canton.network" className="block hover:text-slate-100">
							Canton Docs
						</a>
						<a href="/login" className="block hover:text-slate-100">
							Sign In
						</a>
						<a href="/dashboard" className="block hover:text-slate-100">
							App Dashboard
						</a>
					</div>
					<div className="space-y-2 text-sm text-slate-400">
						<p className="font-medium text-slate-200">Network</p>
						<a href="https://canton.network" className="block hover:text-slate-100">
							Canton Network
						</a>
						<a href="https://www.hyperledger.org" className="block hover:text-slate-100">
							Hyperledger
						</a>
						<a href="https://daml.com" className="block hover:text-slate-100">
							Daml
						</a>
					</div>
				</div>
				<p className="text-xs uppercase tracking-[0.12em] text-slate-500">© {new Date().getFullYear()} Nexus. All rights reserved.</p>
			</div>
		</footer>
	);
}
