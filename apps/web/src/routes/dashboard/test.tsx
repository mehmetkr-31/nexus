import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/test')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/test"!</div>
}
