import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { CreateIouForm } from "../../components/CreateIouForm";
import { IouList } from "../../components/IouList";
import { LedgerStatus } from "../../components/LedgerStatus";
import { PagedIouList } from "../../components/PagedIouList";
import { StreamIouList } from "../../components/StreamIouList";
import { SuspenseIouList } from "../../components/SuspenseIouList";
import { UserInfo } from "../../components/UserInfo";
import { IOU_TEMPLATE_ID, resolveServerSession } from "../../lib/nexus";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
	// 1. Get authed client and resolved party ID (includes auto-provisioning)
	const { client, partyId } = await resolveServerSession();

	// 2. SSR prefetch — QueryClient is populated before HTML ships to browser
	const queryClient = new QueryClient();
	if (client.query) {
		await queryClient.prefetchQuery(
			client.query.contracts({
				templateId: IOU_TEMPLATE_ID,
				parties: [partyId],
			}),
		);
	}

	const dehydratedState = dehydrate(queryClient);

	return (
		<div className="min-h-screen">
			<main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 space-y-12">
				{/* Modern Header Section */}
				<header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-200 dark:border-slate-800">
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="px-3 py-1 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none shadow-lg shadow-blue-500/20">
								Beta Node
							</div>
							<h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
								Nexus Ledger Hub
							</h1>
						</div>
						<p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
							Visualize and interact with your Canton ledger in real-time. This dashboard showcases
							the full power of the{" "}
							<span className="text-blue-600 dark:text-blue-400 font-bold">
								@nexus-framework/react
							</span>{" "}
							hooks suite.
						</p>
					</div>

					<div className="flex items-center gap-4">
						<div className="text-right hidden sm:block">
							<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
								Connected Synchronizer
							</p>
							<p className="text-sm font-bold text-slate-700 dark:text-slate-300">Local Sandbox</p>
						</div>
						<div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
							<span className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
							<div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
						</div>
					</div>
				</header>

				{/* Dashboard Stats Row */}
				<LedgerStatus partyId={partyId} />

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
					<div className="space-y-10">
						{/* Grouped Lists with Hydration Boundary */}
						<div className="space-y-6">
							<div className="flex items-center justify-between px-2">
								<h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
									Smart Contracts
								</h2>
								<div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-6" />
							</div>

							{/* Important: Wrap with HydrationBoundary so Client Components see the prefetched data */}
							<HydrationBoundary state={dehydratedState}>
								<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[500px]">
									<IouList partyId={partyId} />
									<SuspenseIouList partyId={partyId} />
								</div>
							</HydrationBoundary>
						</div>

						{/* Dedicated Live Feed Section */}
						<div className="space-y-6">
							<div className="flex items-center justify-between px-2">
								<h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
									Streaming Buffer
								</h2>
								<div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-6" />
							</div>
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
								<StreamIouList partyId={partyId} />
								<PagedIouList partyId={partyId} />
							</div>
						</div>
					</div>

					{/* Creation Sidebar */}
					<aside className="lg:sticky lg:top-12 space-y-8">
						<UserInfo />
						<CreateIouForm partyId={partyId} />

						{/* Info Card */}
						<div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 space-y-4">
							<p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
								System Information
							</p>
							<div className="space-y-3 text-xs leading-relaxed font-medium">
								<p>
									<span className="text-white">Active Node:</span> {partyId.slice(0, 32)}
									...
								</p>
								<p>
									<span className="text-white">Template:</span> {IOU_TEMPLATE_ID}
								</p>
								<p>
									<span className="text-white">Network:</span> Local Dev
								</p>
							</div>
						</div>
					</aside>
				</div>
			</main>
		</div>
	);
}
