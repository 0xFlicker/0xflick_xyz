import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/PortfolioUI";
import {
  education,
  formatCareerDateRange,
  publicCareerRoles,
  type CareerRole,
} from "@/lib/career";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Experience",
  description:
    "John Dean’s experience across GIPHY, Shutterstock, Verta, Sandbox VR, Time Warner Cable, Accenture, Nokia, and Metrowerks—25+ years of production engineering.",
  path: "/~/cv",
});

const capabilities = [
  [
    "Production AI systems",
    "Agent orchestration, tool use, identity, OAuth, MCP, permissions, durable state, replay, and evaluation artifacts.",
  ],
  [
    "Platforms + distributed systems",
    "APIs, event models, service boundaries, reliability, migrations, observability, and cost-aware cloud infrastructure.",
  ],
  [
    "Consumer + monetization",
    "Advertising, monetization, experimentation, search, content delivery, streaming, payments, and partner surfaces.",
  ],
  [
    "Product engineering",
    "React, TypeScript, GraphQL, Node.js, frontend architecture, integrations, developer tooling, and cross-functional delivery.",
  ],
  [
    "Infrastructure + operations",
    "CI/CD, AWS, Google Cloud, Kubernetes, background workers, incident learning, on-call, and production support.",
  ],
  [
    "Web3 systems",
    "Smart contracts, digital ownership, migrations, protocol tooling, signing flows, and adversarial trust boundaries.",
  ],
] as const;

function ExperienceCard({ role, index }: { role: CareerRole; index: number }) {
  const evidence = [...(role.outcomes ?? []), ...(role.responsibilities ?? [])];
  const titleDiffers =
    role.officialTitle && role.officialTitle !== role.displayTitle;

  return (
    <article
      id={index === 0 ? "giphy" : undefined}
      className="grid scroll-mt-24 gap-7 border-t border-zinc-200 py-10 dark:border-zinc-700/60 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16"
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {role.company}
          </h2>
          {index === 0 && (
            <span className="rounded-full border border-brand-dark/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-dark dark:border-brand-light/40 dark:text-brand-light">
              Current
            </span>
          )}
        </div>
        <p className="mt-3 font-semibold text-zinc-800 dark:text-zinc-200">
          {role.displayTitle}
        </p>
        {titleDiffers && (
          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Historical official title: {role.officialTitle}
          </p>
        )}
        <p className="mt-2 font-mono text-xs text-brand-dark dark:text-brand-light">
          {formatCareerDateRange(role)}
        </p>
        {role.productOrTeam && (
          <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {role.productOrTeam}
          </p>
        )}
      </div>
      <div>
        <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-200">
          {role.summary}
        </p>
        {evidence.length > 0 && (
          <ul className="mt-6 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {evidence.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-dark dark:bg-brand-light"
                />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function ExperiencePage() {
  return (
    <Container className="mt-16 sm:mt-28">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <SectionLabel>Experience</SectionLabel>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          25+ years building systems people depend on.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          I’m John Dean, a Principal Architect at GIPHY. My career runs from
          developer tools and embedded systems through smartphones, streaming,
          creative products, cloud infrastructure, MLOps, monetization, and
          production AI agents.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Button href="/connect">Discuss a role</Button>
          <Button variant="secondary" href="/~/projects">
            View selected work
          </Button>
        </div>
      </header>

      <section className="py-16 sm:py-24" aria-labelledby="chronology-heading">
        <div className="max-w-3xl">
          <SectionLabel>Career chronology</SectionLabel>
          <h2
            id="chronology-heading"
            className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            Products, ownership, shipped work, and operations.
          </h2>
          <p className="mt-5 leading-7 text-zinc-600 dark:text-zinc-300">
            GIPHY marks the start of the Principal Architect role in 2024. The
            two Shutterstock tenures remain separate because they were
            different chapters with different products and responsibilities.
          </p>
        </div>
        <div className="mt-10">
          {publicCareerRoles.map((role, index) => (
            <ExperienceCard
              key={`${role.company}-${role.start}`}
              role={role}
              index={index}
            />
          ))}
        </div>
      </section>

      <section
        className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-24"
        aria-labelledby="capabilities-heading"
      >
        <SectionLabel>Current technical capabilities</SectionLabel>
        <h2
          id="capabilities-heading"
          className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          The technology changes. The operating responsibility does not.
        </h2>
        <dl className="mt-10 grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(([title, description]) => (
            <div
              key={title}
              className="border-zinc-200 py-7 sm:px-6 sm:[&:nth-child(even)]:border-l lg:border-l lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(n+4)]:border-t dark:border-zinc-700/60"
            >
              <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </dt>
              <dd className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {description}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-20"
        aria-labelledby="education-heading"
      >
        <SectionLabel>Education</SectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-baseline">
          <div>
            <h2
              id="education-heading"
              className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              {education.institution}
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">
              {education.degree}
            </p>
          </div>
          <p className="font-mono text-xs text-brand-dark dark:text-brand-light">
            {education.start}–{education.end}
          </p>
        </div>
      </section>
    </Container>
  );
}
