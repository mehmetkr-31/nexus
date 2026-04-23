import LogoLoop, { type LogoItem } from "@/components/LogoLoop";

const logos: LogoItem[] = [
	{ node: <span className="font-semibold">Canton</span>, href: "https://canton.network", title: "Canton" },
	{ node: <span className="font-semibold">Daml</span>, href: "https://daml.com", title: "Daml" },
	{ node: <span className="font-semibold">Splice</span>, href: "https://www.hyperledger.org", title: "Splice" },
	{ node: <span className="font-semibold">Hyperledger</span>, href: "https://www.hyperledger.org", title: "Hyperledger" },
	{ node: <span className="font-semibold">Privacy</span>, title: "Privacy preserving" },
	{ node: <span className="font-semibold">Interoperability</span>, title: "Interoperability" },
];

export function LandingTrustBar() {
	return (
		<section id="trust" className="border-y border-slate-800/70 bg-slate-950/70 px-6 py-12">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
				<p className="text-center text-xs uppercase tracking-[0.22em] text-slate-400">Built on trusted ecosystem</p>
				<LogoLoop
					logos={logos}
					speed={88}
					gap={52}
					logoHeight={20}
					fadeOut
					fadeOutColor="#020617"
					ariaLabel="Nexus ecosystem logos"
				/>
			</div>
		</section>
	);
}
