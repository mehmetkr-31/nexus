import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NexusProvider } from "../components/NexusProvider";
import { Sidebar } from "../components/Sidebar";
import { sessionManager } from "../lib/nexus-server";
import "./globals.css";

export const metadata: Metadata = {
	title: "Nexus Hub | Ledger Playground",
	description: "Canton Ledger integration powered by @nexus-framework/react",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Get session for user switcher
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get("nexus_session");
	const session = sessionCookie ? await sessionManager.getSession(sessionCookie.value) : null;

	return (
		<html lang="en" className="h-full">
			<body className="min-h-full bg-background text-foreground transition-colors duration-300">
				<NexusProvider>
					<div className="flex">
						<Sidebar session={session} />
						<main className="flex-1 lg:ml-72 min-h-screen relative overflow-hidden">
							{/* Background Decorative Elements */}
							<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
							<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full -z-10 animate-float" />

							<div className="relative z-0">{children}</div>
						</main>
					</div>
				</NexusProvider>
			</body>
		</html>
	);
}
