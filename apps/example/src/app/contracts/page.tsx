import { dehydrate, QueryClient } from "@tanstack/react-query";
import { DashboardView } from "../../components/DashboardView";
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

	return <DashboardView partyId={partyId} dehydratedState={dehydratedState} />;
}
