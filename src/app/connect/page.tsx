import { type Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Let’s talk",
  description:
    "Schedule a 30-minute call with Flick to discuss engineering leadership, AI systems, and platform work.",
};

export default function ConnectPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          Let’s talk
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          If you are hiring or partnering with a senior engineering leader who
          can connect product outcomes to platform execution, this is the right
          place to start. I focus on pragmatic delivery, scalable systems, and
          the teams that make them sustainable.
        </p>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-10">
          <section className="space-y-4 rounded-2xl border border-brand-dark p-6 dark:border-brand-light">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              Good fit if you’re…
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base text-zinc-600 dark:text-zinc-400">
              <li>Hiring a senior technical leader who can own systems end-to-end</li>
              <li>
                Scaling a product/platform and need reliability + velocity
              </li>
              <li>
                Building applied AI features and need pragmatic engineering
                execution
              </li>
            </ul>
          </section>
          <section className="space-y-4 rounded-2xl border border-brand-dark p-6 dark:border-brand-light">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              I can help with…
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-base text-zinc-600 dark:text-zinc-400">
              <li>
                Platform engineering &amp; developer enablement (tooling, CI/CD,
                golden paths)
              </li>
              <li>Performance/reliability/observability programs</li>
              <li>
                Monetization + ads infrastructure (decisioning, experimentation,
                measurement)
              </li>
              <li>
                Shipping AI-enabled product features safely (integration
                patterns, evals, guardrails)
              </li>
            </ul>
          </section>
          <section className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
            <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-200">
              Not a fit
            </h2>
            <p>Pure research roles with no product/engineering component.</p>
          </section>
        </div>
        <aside className="rounded-2xl border border-brand-dark p-6 shadow-sm dark:border-brand-light dark:bg-zinc-900/70">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            30-minute intro
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
            If helpful, send a short role blurb or problem statement ahead of
            time.
          </p>
        </aside>
      </div>
      <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-400">
        Based in Colorado (MT). Remote-friendly.
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
