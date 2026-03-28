import { prefetchContracts } from "@nexus-framework/react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { CreateIouForm } from "../../components/CreateIouForm";
import { IouList } from "../../components/IouList";
import {
	CANTON_API_URL,
	getServerClient,
	IOU_TEMPLATE_ID,
	SANDBOX_PARTY_ID,
} from "../../lib/nexus";
import { logoutAction } from "../login/actions";

export default async function ContractsPage() {
	const jar = await cookies();
	const cookieHeader = jar.toString();
	const client = await getServerClient(cookieHeader || null);

	// SSR prefetch — QueryClient is populated before HTML ships to browser
	const queryClient = new QueryClient();
	await prefetchContracts(queryClient, {
		client,
		templateId: IOU_TEMPLATE_ID,
		parties: [SANDBOX_PARTY_ID],
	});

	const dehydratedState = dehydrate(queryClient);

	return (
		<>
			<header>
				<h1>Nexus Example</h1>
				<span className="badge">{CANTON_API_URL}</span>
				<nav>
					<a href="/login">Login</a>
					<form action={logoutAction} style={{ display: "inline" }}>
						<button
							type="submit"
							style={{
								background: "none",
								border: "none",
								color: "#0070f3",
								cursor: "pointer",
								fontSize: "inherit",
								padding: 0,
							}}
						>
							Logout
						</button>
					</form>
				</nav>
			</header>

			<main className="container">
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 340px",
						gap: "1.5rem",
						alignItems: "start",
					}}
				>
					<HydrationBoundary state={dehydratedState}>
						<IouList />
					</HydrationBoundary>

					<CreateIouForm defaultPartyId={SANDBOX_PARTY_ID} />
				</div>
			</main>
		</>
	);
}
