import { Suspense, lazy } from "react";

import ElectricBorder from "@/components/ElectricBorder";
import Magnet from "@/components/Magnet";
import SplitText from "@/components/SplitText";

const Beams = lazy(() => import("@/components/Beams"));

export function LandingFinalCta() {
	return (
		<section id="final-cta" className="relative overflow-hidden px-6 py-28">
			<div className="absolute inset-0 -z-10 opacity-60">
				<Suspense fallback={<div className="h-full w-full bg-slate-950" />}>
					<Beams beamWidth={2.3} beamNumber={12} beamHeight={18} speed={2.2} lightColor="#7dd3fc" />
				</Suspense>
			</div>
			<div className="absolute inset-0 -z-10 bg-slate-950/75" />

			<div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 rounded-3xl border border-slate-700/80 bg-slate-950/60 px-6 py-16 text-center">
				<SplitText
					text="Ready to secure your treasury with Canton-grade multi-signature?"
					tag="h2"
					className="max-w-4xl text-balance text-3xl font-semibold text-blue-50 sm:text-5xl"
					delay={24}
					duration={0.9}
					splitType="words, chars"
				/>
				<p className="max-w-2xl text-sm text-slate-300 sm:text-base">
					Nexus ile policy-driven imza akislari, denetlenebilir governance ve guvenli operasyonu tek platformda topla.
				</p>
				<Magnet padding={120} magnetStrength={1.9}>
					<ElectricBorder color="#22d3ee" borderRadius={18} className="rounded-2xl bg-slate-900/80 p-0.5">
						<a
							href="/dashboard"
							className="inline-flex rounded-2xl px-8 py-3 text-lg font-semibold tracking-wide text-cyan-50"
						>
							Launch Nexus
						</a>
					</ElectricBorder>
				</Magnet>
			</div>
		</section>
	);
}
