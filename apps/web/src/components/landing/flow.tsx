import AnimatedContent from "@/components/AnimatedContent";
import CardSwap, { Card } from "@/components/CardSwap";
import DecryptedText from "@/components/DecryptedText";
import ScrollReveal from "@/components/ScrollReveal";

const cards = [
	{
		title: "1. Propose Transaction",
		desc: "Yeni transfer veya governance aksiyonu policy checks ile olusturulur.",
	},
	{
		title: "2. Collect Signatures",
		desc: "Yetkili imzacilar guvenli kanal uzerinden imza verir, durum anlik guncellenir.",
	},
	{
		title: "3. Commit to Canton",
		desc: "Esik tamamlaninca islem Canton ledger'a atomik ve denetlenebilir bicimde yazilir.",
	},
];

export function LandingFlow() {
	return (
		<section id="flow" className="relative overflow-hidden px-6 py-24">
			<div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2">
				<AnimatedContent distance={40}>
					<div className="space-y-4">
						<p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Multi-sig flow</p>
						<ScrollReveal
							containerClassName="!my-0"
							textClassName="!text-2xl !leading-[1.35] text-blue-50 sm:!text-4xl"
						>
							{`Nexus, tekliften kesinlesmeye kadar tum onay akisini taraflar arasi gizlilik bozulmadan Canton uzerinde yurutur.`}
						</ScrollReveal>
						<div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
							<DecryptedText
								text="Cryptographically secure. Policy enforced. Audit ready."
								speed={42}
								maxIterations={14}
								className="text-sm text-slate-300"
								encryptedClassName="text-sm text-blue-300"
								parentClassName="font-mono"
							/>
						</div>
					</div>
				</AnimatedContent>

				<AnimatedContent distance={70}>
					<div className="relative min-h-[420px] rounded-3xl border border-slate-800/70 bg-slate-900/35">
						<CardSwap cardDistance={42} verticalDistance={56} width={280} height={180} delay={3600}>
							{cards.map((item) => (
								<Card key={item.title} customClass="bg-slate-950/95 p-5 text-slate-200">
									<h3 className="text-lg font-semibold text-blue-100">{item.title}</h3>
									<p className="mt-2 text-sm text-slate-400">{item.desc}</p>
								</Card>
							))}
						</CardSwap>
					</div>
				</AnimatedContent>
			</div>
		</section>
	);
}
