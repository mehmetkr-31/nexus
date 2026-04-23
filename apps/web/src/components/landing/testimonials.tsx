import AnimatedContent from "@/components/AnimatedContent";
import TiltedCard from "@/components/TiltedCard";

const testimonials = [
	{
		quote: "Nexus ile onay sureclerimiz daha hizli ve denetlenebilir hale geldi.",
		author: "Treasury Lead, Digital Asset Firm",
		color: "1f2937",
	},
	{
		quote: "Canton tabanli gizlilik modeli, kurumsal uyum beklentimizi dogrudan karsiladi.",
		author: "Compliance Director, Financial Institution",
		color: "0f172a",
	},
	{
		quote: "m-of-n policy ve audit trail birlikte calisinca operasyonel risk belirgin sekilde azaldi.",
		author: "COO, Infrastructure Provider",
		color: "1e1b4b",
	},
];

const imageFromColor = (hex: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="420" viewBox="0 0 700 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#${hex}" />
          <stop offset="100%" stop-color="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="700" height="420" fill="url(#g)" />
    </svg>`,
	)}`;

export function LandingTestimonials() {
	return (
		<section id="testimonials" className="px-6 py-24">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
				<AnimatedContent distance={30}>
					<div className="text-center">
						<p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Testimonials</p>
						<h2 className="mt-3 text-3xl font-semibold text-blue-50 sm:text-5xl">Trusted by teams moving real value</h2>
					</div>
				</AnimatedContent>

				<div className="grid gap-4 lg:grid-cols-3">
					{testimonials.map((item) => (
						<AnimatedContent key={item.author} distance={24}>
							<div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-3">
								<TiltedCard
									imageSrc={imageFromColor(item.color)}
									altText={item.author}
									captionText={item.author}
									showMobileWarning={false}
									showTooltip
									imageWidth="100%"
									imageHeight="220px"
									containerHeight="220px"
									containerWidth="100%"
								/>
								<div className="mt-3 p-2">
									<p className="text-sm text-slate-200">"{item.quote}"</p>
									<p className="mt-3 text-xs uppercase tracking-[0.15em] text-slate-400">{item.author}</p>
								</div>
							</div>
						</AnimatedContent>
					))}
				</div>
			</div>
		</section>
	);
}
