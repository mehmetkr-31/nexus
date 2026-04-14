import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard/test")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/dashboard/test"!</div>;
}
