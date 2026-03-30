import { LiveActivityFeed } from "../../components/LiveActivityFeed";
import { resolveServerSession } from "../../lib/nexus";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
	const { partyId } = await resolveServerSession();
	return <LiveActivityFeed partyId={partyId} />;
}
