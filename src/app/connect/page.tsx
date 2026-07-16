import { type Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { createPageMetadata, profileLinks } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Connect",
  description:
    "Connect with John Dean / Flick about remote Principal and Staff+ roles in production AI, developer platforms, distributed systems, and technically difficult products.",
  path: "/connect",
});

export default function ConnectPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          Build the difficult thing. Make it operable.
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          I’m exploring remote Principal and Staff+ engineering roles focused
          on production AI systems, distributed systems,
          and technically difficult products.
        </p>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-10">
          <section className="space-y-4 rounded-2xl border border-brand-dark p-6 dark:border-brand-light">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light">
              Full-time roles
            </p>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Principal scope connected to implementation and operations
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base text-zinc-600 dark:text-zinc-400">
              <li>Principal Engineer or Principal Architect</li>
              <li>Principal AI Platform Engineer or Staff+ AI Systems Engineer</li>
              <li>Developer Platform Architect</li>
              <li>Applied AI and agent infrastructure</li>
              <li>Platforms, distributed systems, and developer experience</li>
              <li>Hands-on architecture leadership</li>
            </ul>
          </section>
          <section className="space-y-4 rounded-2xl border border-brand-dark p-6 dark:border-brand-light">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light">
              Selected advisory work
            </p>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Focused architecture support
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base text-zinc-600 dark:text-zinc-400">
              <li>Architecture and design reviews</li>
              <li>Agent-system design and permission boundaries</li>
              <li>Platform, migration, and reliability programs</li>
              <li>Developer experience and delivery systems</li>
              <li>Monetization and advertising infrastructure</li>
            </ul>
          </section>
          <section className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
            <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-200">
              Best fit
            </h2>
            <p>
              Roles where architecture remains connected to implementation,
              operations, communication, and measurable product outcomes.
            </p>
          </section>
        </div>
        <aside className="rounded-2xl border border-brand-dark p-6 shadow-sm dark:border-brand-light dark:bg-zinc-900/70">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            Start a conversation
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base text-zinc-600 dark:text-zinc-400">
            <li>Goals and outcomes for the role or project</li>
            <li>Scope, team structure, and key dependencies</li>
            <li>Timeline, urgency, and decision process</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              href="https://calendly.com/me-0xflick/30min"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book on Calendly
            </Button>
            <Button variant="secondary" href={profileLinks.email}>
              Email me
            </Button>
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Email works just as well. A short role brief, team shape, or system
            problem is useful context.
          </p>
        </aside>
      </div>
      <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-400">
        Based in Colorado (Mountain Time) and open to remote Principal and
        Staff+ roles.
      </p>
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Prefer to explore first?{" "}
        <Link
          href="/~/projects"
          className="font-medium text-zinc-700 transition hover:text-brand-dark dark:text-zinc-200 dark:hover:text-brand-light-400"
        >
          See recent work
        </Link>
        .
      </p>
    </Container>
  );
}
