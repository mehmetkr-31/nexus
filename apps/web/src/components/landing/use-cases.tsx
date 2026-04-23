import AnimatedContent from "@/components/AnimatedContent";
import ScrollStack, { ScrollStackItem } from "@/components/ScrollStack";
import SpotlightCard from "@/components/SpotlightCard";

const useCases = [
	{
		title: "DAO Treasury Management",
		desc: "Topluluk fonlari icin coklu imza kosullari, zamanli onay pencereleri ve net denetim izi.",
	},
	{
		title: "Corporate Approval Chains",
		desc: "Finans, hukuk ve operasyon ekipleri arasinda rol bazli, adim adim kurumsal onay akisi.",
	},
	{
		title: "Custody & Asset Control",
		desc: "Kurumsal varlik transferlerinde tek nokta riskini azaltan guvenli custody politikasi.",
	},
	{
		title: "DvP Settlement",
		desc: "Teslimat ve odemenin birlikte teyit edildigi atomik akislarda guvenli mutabakat.",
	},
];

export function LandingUseCases() {
	return (
		<section id="use-cases" className="px-6 py-24">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
				<AnimatedContent distance={40}>
					<div className="text-center">
						<p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Use cases</p>
						<h2 className="mt-3 text-3xl font-semibold text-blue-50 sm:text-5xl">Designed for high-stakes workflows</h2>
					</div>
				</AnimatedContent>

				<div className="h-[760px] rounded-3xl border border-slate-800/70 bg-slate-900/20">
					<ScrollStack itemScale={0.02} itemStackDistance={24} stackPosition="22%" useWindowScroll={false}>
						{useCases.map((item, index) => (
							<ScrollStackItem key={item.title} itemClassName="!h-[260px] !rounded-3xl !bg-transparent !p-0">
								<SpotlightCard
									className="h-full border border-slate-700 bg-slate-950/90"
									spotlightColor="rgba(59, 130, 246, 0.32)"
								>
									<p className="text-xs uppercase tracking-[0.16em] text-slate-400">Use Case 0{index + 1}</p>
									<h3 className="mt-3 text-2xl font-semibold text-blue-100">{item.title}</h3>
									<p className="mt-4 max-w-2xl text-sm text-slate-300">{item.desc}</p>
								</SpotlightCard>
							</ScrollStackItem>
						))}
					</ScrollStack>
				</div>
			</div>
		</section>
	);
}
