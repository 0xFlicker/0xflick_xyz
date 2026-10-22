import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/PortfolioUI";
import {
  education,
  formatCareerDateRange,
  getCareerRoleLabel,
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

function ExperienceCard({ role, index }: { role: CareerRole; index: number }) {
  const evidence = [...(role.outcomes ?? []), ...(role.responsibilities ?? [])];

  return (
    <article
      id={role.id}
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
          {getCareerRoleLabel(role)}
        </p>
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
    <Container className="mt-12 sm:mt-20">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          Experience.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          25+ years across developer tools, creative software, games, and AI
          systems. Currently Principal Architect at GIPHY.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Button href="/connect">Discuss a role</Button>
          <Button variant="secondary" href="/~/projects">
            Explore products and tools
          </Button>
        </div>
      </header>

      <section className="py-8 sm:py-12" aria-label="Career history">
          {publicCareerRoles.map((role, index) => (
            <ExperienceCard
              key={`${role.company}-${role.start}`}
              role={role}
              index={index}
            />
          ))}
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
