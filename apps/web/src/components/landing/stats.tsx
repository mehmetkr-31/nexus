import { Suspense, lazy } from "react";

import AnimatedContent from "@/components/AnimatedContent";
import CountUp from "@/components/CountUp";

const Aurora = lazy(() => import("@/components/Aurora"));

const stats = [
	{ label: "Uptime", value: 99.99, suffix: "%" },
	{ label: "Assets Secured", value: 12.4, prefix: "$", suffix: "B+" },
	{ label: "Active Signers", value: 8600, suffix: "+" },
];

export function LandingStats() {
	return (
		<section id="stats" className="relative overflow-hidden px-6 py-24">
			<div className="absolute inset-0 -z-10 opacity-60">
				<Suspense fallback={<div className="h-full w-full bg-slate-900" />}>
					<Aurora colorStops={["#0f172a", "#1d4ed8", "#22d3ee"]} amplitude={0.9} blend={0.45} speed={0.8} />
				</Suspense>
			</div>
			<div className="absolute inset-0 -z-10 bg-slate-950/60" />

			<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
				<AnimatedContent distance={40}>
					<div className="text-center">
						<p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Proven in production</p>
						<h2 className="mt-3 text-3xl font-semibold text-blue-50 sm:text-5xl">Operational reliability for critical approvals</h2>
					</div>
				</AnimatedContent>

				<div className="grid gap-4 md:grid-cols-3">
					{stats.map((stat) => (
						<AnimatedContent key={stat.label} distance={28}>
							<article className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-6 text-center">
								<div className="text-4xl font-semibold text-blue-100 sm:text-5xl">
									{stat.prefix}
									<CountUp to={stat.value} duration={2.2} separator="," />
									{stat.suffix}
								</div>
								<p className="mt-3 text-sm uppercase tracking-[0.16em] text-slate-300">{stat.label}</p>
							</article>
						</AnimatedContent>
					))}
				</div>
			</div>
		</section>
	);
}
