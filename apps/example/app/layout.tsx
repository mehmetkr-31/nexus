import type { Metadata } from "next";
import { NexusClientProvider } from "../components/NexusClientProvider";
import "./globals.css";

export const metadata: Metadata = {
	title: "Nexus Example — Canton dApp",
	description: "Demo dApp built with @nexus-framework/react",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<NexusClientProvider>{children}</NexusClientProvider>
			</body>
		</html>
	);
}
