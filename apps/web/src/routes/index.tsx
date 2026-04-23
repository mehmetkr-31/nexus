import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect } from "react";

import { LandingPage } from "@/components/landing/landing-page";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { setTheme } = useTheme();

	useEffect(() => {
		setTheme("dark");
	}, [setTheme]);

	return <LandingPage />;
}
