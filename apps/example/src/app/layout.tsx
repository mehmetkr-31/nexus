import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NexusProvider } from "../components/NexusProvider";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Nexus Hub - Canton Demo",
	description: "Canton Ledger integration powered by @nexus-framework/react",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
				<NexusProvider>{children}</NexusProvider>
			</body>
		</html>
	);
}
