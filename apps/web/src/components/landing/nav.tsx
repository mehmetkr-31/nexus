import ElectricBorder from "@/components/ElectricBorder";

export function LandingNav() {
	return (
		<header className="fixed inset-x-0 top-6 z-50 flex justify-center px-6">
			<nav className="flex w-full max-w-4xl items-center justify-between rounded-full border border-slate-800/50 bg-slate-950/40 px-6 py-2.5 backdrop-blur-md shadow-2xl">
				{/* Logo */}
				<a href="#hero" className="flex items-center">
					<img
						src="/assets/logo.png"
						alt="signuit"
						className="h-8 w-auto select-none"
						draggable={false}
					/>
				</a>

				{/* Desktop Links */}
				<div className="hidden items-center gap-8 md:flex">
					<a href="#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
						Features
					</a>
					<a href="#how-it-works" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
						How it works
					</a>
					<a href="#use-cases" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
						Solutions
					</a>
					<a href="https://docs.canton.network" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
						Docs
					</a>
				</div>

				{/* CTA Buttons */}
				<div className="flex items-center gap-3">
					<a
						href="/login"
						className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block"
					>
						Sign in
					</a>
					
						<ElectricBorder
							color="#3b82f6"
							className="rounded-full bg-white transition-transform active:scale-95"
							style={{ borderRadius: 9999 }}
						>
							<a
								href="/dashboard"
								className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100"
							>
								Launch App
							</a>
						</ElectricBorder>
					
				</div>
			</nav>
		</header>
	);
}
