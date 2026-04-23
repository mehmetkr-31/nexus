import { Suspense, lazy } from "react";

import BlurText from "@/components/BlurText";
import SplitText from "@/components/SplitText";
import StarBorder from "@/components/StarBorder";
import TextType from "@/components/TextType";

const FaultyTerminal = lazy(() => import("@/components/FaultyTerminal"));

export function LandingHero() {
	return (
		<section id="hero" className="relative overflow-hidden px-6 pb-20 pt-48">
			<div className="absolute inset-0 z-0">
				<Suspense fallback={null}>
					<FaultyTerminal
						scale={1.6}
						gridMul={[2, 1]}
						digitSize={1.2}
						timeScale={0.6}
						scanlineIntensity={0.5}
						glitchAmount={1}
						flickerAmount={0.8}
						noiseAmp={1}
						chromaticAberration={0}
						curvature={0.1}
						tint="#A7EF9E"
						mouseReact
						mouseStrength={0.4}
						pageLoadAnimation
						brightness={0.6}
					/>
				</Suspense>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />
			</div>

			<div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-start gap-8">
				<div className="max-w-4xl">
					<SplitText
						text="Secure Multi-Signature on Canton Network"
						tag="h1"
						className="text-balance text-4xl font-semibold leading-tight text-blue-50 sm:text-5xl lg:text-7xl"
						delay={28}
						duration={1}
						threshold={0.05}
						rootMargin="-40px"
						splitType="words, chars"
						textAlign="left"
					/>
				</div>

				<div className="max-w-3xl text-lg text-slate-200 sm:text-xl">
					<BlurText
						text="Nexus, Canton Network uzerinde kurumsal seviyede m-of-n imza yonetimi, gizlilik korumali onay akislar ve denetlenebilir yonetisim saglar."
						animateBy="words"
						delay={60}
					/>
				</div>

				<div className="rounded-full border border-blue-400/30 bg-slate-950/60 px-4 py-2 text-sm text-blue-100">
					<TextType
						text={["DAO Treasury", "Institutional Custody", "Governance Approvals", "Digital Asset Control"]}
						typingSpeed={50}
						deletingSpeed={30}
						pauseDuration={1300}
						loop
					/>
				</div>

				<div className="flex flex-wrap items-center gap-4 pt-2">

					<a
						href="/dashboard"
						className="inline-flex rounded-2xl px-6 py-3 text-base font-semibold text-blue-50"
					>
						Launch Nexus
					</a>



					<StarBorder as="a" href="https://docs.canton.network" className="rounded-2xl">
						Read Docs
					</StarBorder>

				</div>
			</div>
		</section>
	);
}
