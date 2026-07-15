import { type Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Connect",
  description:
    "Connect with Flick about Principal Architect and Staff+ roles or selected advisory work in AI, platforms, distributed systems, developer experience, and monetization.",
  path: "/connect",
});

export default function ConnectPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          Let’s talk
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          If you need a Principal Architect who can connect product outcomes to
          platform execution - and stay close enough to implementation to keep
          the design honest - this is the right place to start.
        </p>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-10">
          <section className="space-y-4 rounded-2xl border border-brand-dark p-6 dark:border-brand-light">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light">
              Full-time leadership roles
            </p>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Principal scope with an implementation feedback loop
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base text-zinc-600 dark:text-zinc-400">
              <li>Principal Engineer or Principal Architect</li>
              <li>Staff+ engineering and hands-on architecture leadership</li>
              <li>Production AI and agent platforms</li>
              <li>Platforms, distributed systems, and developer experience</li>
              <li>Monetization and large-scale consumer systems</li>
            </ul>
          </section>
          <section className="space-y-4 rounded-2xl border border-brand-dark p-6 dark:border-brand-light">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light">
              Selected advisory work
            </p>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              A focused intervention, not consultancy theater
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
              Not a fit
            </h2>
            <p>
              Pure research roles with no product or engineering ownership,
              hands-off architecture roles, and engagements that need a slide
              deck more than a working system.
            </p>
          </section>
        </div>
        <aside className="rounded-2xl border border-brand-dark p-6 shadow-sm dark:border-brand-light dark:bg-zinc-900/70">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            Start with 30 minutes
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
            <Button variant="secondary" href="mailto:me@0xflick.xyz">
              Email me
            </Button>
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            flick.ing is the professional home. If helpful, send a short role
            brief or system problem ahead of time.
          </p>
        </aside>
      </div>
      <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-400">
        Based in Colorado (Mountain Time). Remote-friendly; Colorado-based
        hybrid conversations are welcome.
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
