import Link from "next/link";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import {
  capabilityAreas,
  selectedWork,
  selectedWorkIds,
} from "@/lib/portfolio";
import { profileLinks } from "@/lib/site";

const systemFlow = [
  ["01", "Persistent agents", "Identity, memory, and scoped tools"],
  ["02", "Influence", "The first production game"],
  ["03", "Event history", "Runtime, replay, and analysis"],
  ["04", "Operations", "Infrastructure and observability"],
] as const;

const principalScope = [
  {
    title: "Set technical direction",
    description:
      "Define system boundaries, standards, and sequencing across product, monetization, and platform concerns.",
  },
  {
    title: "Resolve cross-team constraints",
    description:
      "Make product goals, infrastructure limits, delivery pressure, and revenue consequences visible in the same decision.",
  },
  {
    title: "Lead reliability and change",
    description:
      "Guide migrations, operational improvements, and design reviews inside mature systems that cannot simply stop.",
  },
  {
    title: "Respond to emergent problems",
    description:
      "Address incidents, outages, and unexpected product behavior across multiple teams and systems, often under time pressure.",
  },
] as const;

export function PortfolioHome() {
  return (
    <div className="portfolio-enter pb-8">
      <Container className="mt-16 sm:mt-24">
        <section className="grid items-end gap-12 border-b border-zinc-200 pb-16 dark:border-zinc-700/60 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20 lg:pb-24">
          <div>
            <SectionLabel className="tracking-[0.22em]">
              John Dean / Flick · Principal Architect
            </SectionLabel>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.045em] text-zinc-900 sm:text-6xl lg:text-7xl dark:text-white">
              Turning emerging platforms into production systems.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              I’m John Dean, known online as Flick and 0xFlicker. I’m a
              Principal Architect at GIPHY with 25+ years building and operating
              systems across developer tools, consumer products, cloud
              platforms, MLOps, monetization, and AI agents. I stay close enough
              to the code to know when the architecture is lying.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button href="/~/projects">View selected work</Button>
              <Button variant="secondary" href="/~/cv">
                View experience
              </Button>
              <ArrowLink href="/connect">Connect</ArrowLink>
            </div>
          </div>

          <aside className="border-l-2 border-brand-dark pl-6 dark:border-brand-light sm:pl-8">
            <div className="flex items-baseline justify-between gap-4">
              <SectionLabel className="tracking-[0.22em]">
                Current build
              </SectionLabel>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Independent product
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              The House / Influence
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              The House is the platform. Influence is its first production game,
              built end to end across agents, permissions, multiplayer runtime,
              product, infrastructure, and operations.
            </p>
            <ol className="mt-8 space-y-0" aria-label="The House system flow">
              {systemFlow.map(([number, title, description], index) => (
                <li
                  key={title}
                  className="grid grid-cols-[2.5rem_1fr] gap-3"
                >
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-dark/40 font-mono text-[10px] font-semibold text-brand-dark dark:border-brand-light/50 dark:text-brand-light">
                      {number}
                    </span>
                    {index < systemFlow.length - 1 && (
                      <span className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </div>
                  <div className="pb-5">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <ArrowLink href={`/~/projects#${selectedWorkIds.theHouse}`}>
              Read about The House
            </ArrowLink>
          </aside>
        </section>
      </Container>


      <Container className="mt-20 sm:mt-28">
        <section aria-labelledby="principal-scope-heading">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <SectionLabel>Principal Architect · GIPHY</SectionLabel>
              <h2
                id="principal-scope-heading"
                className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
              >
                Technical direction for a mature consumer platform.
              </h2>
            </div>
            <div>
              <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-300">
                At GIPHY, I set technical direction across monetization and
                advertising across search, content delivery, partner, API, and
                platform systems. Reliability, infrastructure cost, delivery,
                and product behavior all shape the work.
              </p>
            </div>
          </div>
          <div className="mt-10 grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2">
            {principalScope.map((item, index) => (
              <article
                key={item.title}
                className="border-zinc-200 py-7 sm:[&:nth-child(odd)]:pr-6 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-6 sm:[&:nth-child(n+3)]:border-t dark:border-zinc-700/60"
              >
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <section aria-labelledby="scope-heading">
          <div className="grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
            <div>
              <SectionLabel>Architectural lens</SectionLabel>
              <h2
                id="scope-heading"
                className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
              >
                Production is the truth serum.
              </h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              Architecture has to survive contact with reliability, cost,
              permissions, developer experience, product behavior, and the
              humans operating the system after launch. Elegant boxes are nice;
              a system that keeps working on Tuesday afternoon is nicer.
            </p>
          </div>
          <div className="mt-12 grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2 lg:grid-cols-4">
            {capabilityAreas.map((area, index) => (
              <article
                key={area.title}
                className="border-zinc-200 py-8 sm:[&:nth-child(odd)]:pr-6 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-6 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0 dark:border-zinc-700/60"
              >
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {area.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {area.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container className="mt-24 sm:mt-32">
        <section aria-labelledby="work-heading">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <SectionLabel>Selected work</SectionLabel>
              <h2
                id="work-heading"
                className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white"
              >
                A few systems that explain the range.
              </h2>
            </div>
            <ArrowLink href="/~/projects">View the deeper cut</ArrowLink>
          </div>

          <div className="mt-12 border-t border-zinc-200 dark:border-zinc-700/60">
            {selectedWork.map((work, index) => (
              <article
                key={work.id}
                className="group grid gap-5 border-b border-zinc-200 py-9 transition-colors hover:bg-brand-light/10 dark:border-zinc-700/60 dark:hover:bg-brand-dark/10 sm:grid-cols-[3rem_0.8fr_1.2fr] sm:px-4"
              >
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                  0{index + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light">
                    {work.eyebrow}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    <Link
                      href={`/~/projects#${work.id}`}
                      className="outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:focus-visible:outline-brand-light"
                    >
                      {work.title}
                    </Link>
                  </h3>
                </div>
                <div>
                  <p className="leading-7 text-zinc-600 dark:text-zinc-300">
                    {work.summary}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {work.focus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container className="mt-24 sm:mt-32">
        <section className="border-y border-zinc-200 py-16 dark:border-zinc-700/60 lg:py-20">
          <div className="max-w-3xl">
            <SectionLabel>Career throughline</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              New platforms. Same job.
            </h2>
            <p className="mt-6 text-base leading-7 text-zinc-600 dark:text-zinc-300">
              I started in embedded systems, moved through mobile, streaming,
              consumer web, cloud platforms, ML operations, and internet-scale
              media, and now build AI-agent systems. The recurring work is
              turning unfamiliar constraints into software people can use and
              teams can operate.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <ArrowLink href="/~/about">Read the full story</ArrowLink>
              <ArrowLink href={profileLinks.github}>
                Open-source work as 0xFlicker
              </ArrowLink>
              <ArrowLink href={profileLinks.originalGithub}>
                Earlier work as CaptEmulation
              </ArrowLink>
            </div>
          </div>
        </section>
      </Container>

      <Container className="mt-24 sm:mt-32">
        <section className="rounded-2xl bg-brand-dark px-6 py-12 text-white sm:px-10 sm:py-14 lg:flex lg:items-end lg:justify-between lg:gap-16 dark:bg-brand-light dark:text-brand-dark">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-light dark:text-brand-dark/70">
              What’s next
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Looking for a hands-on Principal engineer?
            </h2>
            <p className="mt-5 leading-7 text-brand-light/80 dark:text-brand-dark/80">
              I’m based in Colorado and open to remote Principal and Staff+
              roles focused on production AI, developer platforms, distributed
              systems, and technically difficult products.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 lg:mt-0 lg:flex-col lg:items-start">
            <Link
              href="/connect"
              className="inline-flex rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark outline-offset-4 transition hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-white dark:bg-brand-dark dark:text-white dark:hover:bg-brand-dark/90 dark:focus-visible:outline-brand-dark"
            >
              Start a conversation
            </Link>
            <Link
              href="/intro"
              className="text-sm font-medium text-brand-light underline decoration-brand-light/40 underline-offset-4 transition hover:decoration-brand-light dark:text-brand-dark dark:decoration-brand-dark/40"
            >
              Visit the original WebGL intro
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
}
