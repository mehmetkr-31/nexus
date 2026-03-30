import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { DashboardView } from "../../components/DashboardView";
import { IOU_TEMPLATE_ID, resolveServerSession } from "../../lib/nexus";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
	const { client, partyId } = await resolveServerSession();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5_000,
				retry: 2,
				retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
			},
		},
	});

	await queryClient.prefetchQuery(
		client.query.contracts({ templateId: IOU_TEMPLATE_ID, parties: [partyId] }),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<DashboardView partyId={partyId} />
		</HydrationBoundary>
	);
}
