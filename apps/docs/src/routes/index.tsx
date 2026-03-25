import { createFileRoute, Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium text-fd-muted-foreground">
          Canton Ledger × Next.js × TanStack
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
          Build Canton dApps without the{' '}
          <span className="text-fd-primary">Integration Tax</span>
        </h1>

        <p className="text-fd-muted-foreground max-w-xl text-lg">
          Nexus Framework is a type-safe ORPC layer that bridges the Canton JSON Ledger API with
          React, Next.js, and TanStack Query. Auth, queries, mutations — all wired up.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/docs/$"
            params={{ _splat: 'getting-started/installation' }}
            className="px-5 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm"
          >
            Get Started →
          </Link>
          <Link
            to="/docs/$"
            params={{ _splat: '' }}
            className="px-5 py-2.5 rounded-lg border font-medium text-sm hover:bg-fd-muted"
          >
            Read the Docs
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-3xl w-full text-left">
          <FeatureCard
            icon="⚡"
            title="Zero Boilerplate Auth"
            description="Sandbox HMAC256, JWT, and OIDC in one config line. Auto-refresh included."
          />
          <FeatureCard
            icon="🔄"
            title="TanStack Query Integration"
            description="Type-safe queryOptions, smart cache invalidation by Daml template ID."
          />
          <FeatureCard
            icon="🖥️"
            title="Next.js SSR Ready"
            description="Server Components, Server Actions, and HydrationBoundary — out of the box."
          />
        </div>
      </main>
    </HomeLayout>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-2">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-fd-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
