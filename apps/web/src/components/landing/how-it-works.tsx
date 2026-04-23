import { Suspense, lazy } from "react";

import AnimatedContent from "@/components/AnimatedContent";
import Stepper, { Step } from "@/components/Stepper";

const DotGrid = lazy(() => import("@/components/DotGrid"));

const steps = [
	{
		title: "Create Treasury Wallet",
		desc: "Canton domain ve policy parametreleri ile kurumsal cuzdan tanimla.",
	},
	{
		title: "Assign Co-signers",
		desc: "Imza yetkilerini roller ve limitlerle dagit, m-of-n kosulunu sec.",
	},
	{
		title: "Propose & Review",
		desc: "Teklif olustur, detaylari ekip icinde gozden gecir ve gercek zamanli takip et.",
	},
	{
		title: "Execute on Canton",
		desc: "Esik saglandiginda islem atomik sekilde ledger'a commit edilir.",
	},
];

export function LandingHowItWorks() {
	return (
		<section id="how-it-works" className="relative overflow-hidden px-6 py-24">
			<div className="absolute inset-0 -z-10 opacity-30">
				<Suspense fallback={<div className="h-full w-full bg-slate-950/70" />}>
					<DotGrid dotSize={7} gap={18} baseColor="#1e3a8a" activeColor="#38bdf8" proximity={180} />
				</Suspense>
			</div>

			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 sm:p-10">
				<AnimatedContent distance={40}>
					<div className="mb-6 text-center">
						<p className="text-sm uppercase tracking-[0.2em] text-cyan-300">How it works</p>
						<h2 className="mt-3 text-3xl font-semibold text-blue-50 sm:text-5xl">From intent to final settlement</h2>
					</div>
				</AnimatedContent>

				<AnimatedContent distance={50}>
					<Stepper
						initialStep={1}
						nextButtonText="Next Step"
						backButtonText="Back"
						stepCircleContainerClassName="bg-slate-950"
						stepContainerClassName="!px-4"
						contentClassName="!text-slate-300"
						nextButtonProps={{ className: "!bg-blue-600 hover:!bg-blue-500" }}
					>
						{steps.map((step) => (
							<Step key={step.title}>
								<div className="pb-8">
									<h3 className="text-lg font-semibold text-blue-100">{step.title}</h3>
									<p className="mt-2 text-sm leading-relaxed text-slate-300">{step.desc}</p>
								</div>
							</Step>
						))}
					</Stepper>
				</AnimatedContent>
			</div>
		</section>
	);
}
