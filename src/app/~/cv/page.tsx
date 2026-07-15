import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Experience",
  description:
    "Flick's experience as a Principal Architect and hands-on engineering leader across production AI, platforms, monetization, streaming, mobile, and embedded systems.",
  path: "/~/cv",
});

type ExperienceEntry = {
  title: string;
  context: string;
  dates: string;
  summary: string;
  evidence: readonly string[];
};

const recentExperience: readonly ExperienceEntry[] = [
  {
    title: "Frontend Lead",
    context: "Enterprise MLOps platform · Employer anonymized",
    dates: "2020–2022",
    summary:
      "Inherited product and frontend ownership from the CTO and connected that surface to platform delivery, operations, and enterprise customers.",
    evidence: [
      "Set frontend technical direction across marketing, product, and GraphQL surfaces.",
      "Built orchestration layers for frontend engineers and coordinated subcontractor delivery.",
      "Contributed to CI/CD, operational integrations, enterprise customization, support, and on-call.",
    ],
  },
  {
    title: "Web Tech Lead",
    context: "Interactive multiplayer live events · Employer anonymized",
    dates: "2019–2020",
    summary:
      "Owned the web platform around a live-event gaming product, where product surfaces and business systems had to move together.",
    evidence: [
      "Led scheduling, leaderboards, payments, advertising, and social-sharing surfaces.",
      "Worked across a Next.js and GraphQL product with cloud-hosted multiplayer dependencies.",
      "Balanced rapid product delivery with the operating constraints of live events.",
    ],
  },
  {
    title: "Product, platform, and operations engineering",
    context: "Major media platform · Employer anonymized",
    dates: "2015–2019",
    summary:
      "Built creative tools and developer-facing integrations while expanding into the infrastructure and operational work behind the product.",
    evidence: [
      "Contributed to online creative tools and an SDK for external developers.",
      "Worked across frontend, backend, APIs, cloud infrastructure, Kubernetes, and delivery systems.",
      "Participated in operational ownership and on-call for core product surfaces.",
    ],
  },
] as const;

const earlierExperience: readonly ExperienceEntry[] = [
  {
    title: "Platform Engineer",
    context: "Consumer streaming and embedded television",
    dates: "2013–2015",
    summary:
      "Built core product behavior for an HTML5 television interface and an online video streaming platform.",
    evidence: [
      "Implemented stream handling, security, emergency notification, and consumer interface features.",
      "Optimized performance and memory use inside an embedded browser runtime.",
    ],
  },
  {
    title: "Mobile Consultant",
    context: "Technology consulting",
    dates: "2011–2013",
    summary:
      "Helped clients repair existing mobile applications and deliver new iOS, Android, and cross-platform products.",
    evidence: [
      "Worked directly with client constraints, inherited systems, and platform transitions.",
      "Delivered across native and early cross-platform mobile stacks.",
    ],
  },
  {
    title: "Test automation and SDK engineering",
    context: "Smartphone and silicon platforms",
    dates: "2000–2011",
    summary:
      "Designed factory, application, SDK, and developer-tool testing across embedded boards and early smartphone platforms.",
    evidence: [
      "Built automated test tools for applications, SDKs, examples, and development boards.",
      "Maintained developer examples and test libraries across constrained hardware and software environments.",
    ],
  },
] as const;

const capabilities = [
  {
    title: "Production AI systems",
    description:
      "Agent architecture, orchestration, durable state, tool use, identity, OAuth, MCP, permissions, and evaluation artifacts.",
  },
  {
    title: "Platforms + distributed systems",
    description:
      "Service boundaries, APIs, event history, multiplayer runtimes, reliability, migrations, and operational ownership.",
  },
  {
    title: "Consumer + monetization systems",
    description:
      "Advertising, monetization, experimentation, search, content delivery, streaming, payments, and partner surfaces.",
  },
  {
    title: "Developer experience + operations",
    description:
      "Technical standards, delivery paths, GitHub Actions, CI/CD, Kubernetes, observability, incident response, and cost-aware infrastructure.",
  },
  {
    title: "Product engineering",
    description:
      "React, Next.js, TypeScript, GraphQL, Node.js, Go, frontend architecture, integrations, and cross-functional delivery.",
  },
  {
    title: "Web3 systems",
    description:
      "Smart contracts, digital ownership, collection migrations, protocol tooling, signing flows, and adversarial trust boundaries.",
  },
] as const;

function ExperienceCard({ entry }: { entry: ExperienceEntry }) {
  return (
    <article className="grid gap-6 border-t border-zinc-200 py-9 dark:border-zinc-700/60 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {entry.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {entry.context}
        </p>
        <p className="mt-2 font-mono text-xs text-brand-dark dark:text-brand-light">
          {entry.dates}
        </p>
      </div>
      <div>
        <p className="leading-7 text-zinc-700 dark:text-zinc-200">
          {entry.summary}
        </p>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {entry.evidence.map((item) => (
            <li key={item} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-dark dark:bg-brand-light"
              />
              {item}
            </li>
          ))}
        </ul>
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
          Principal Architect. Hands-on when the architecture needs proof.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          More than 25 years turning new platforms into production systems -
          from embedded boards and early smartphones to streaming, cloud,
          MLOps, revenue-critical monetization, Web3, and AI agents.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Button href="/connect">Discuss a role</Button>
          <Button variant="secondary" href="/~/projects">
            View case studies
          </Button>
        </div>
      </header>

      <section className="py-16 sm:py-24" aria-labelledby="current-role-heading">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <SectionLabel>Current role</SectionLabel>
            <h2
              id="current-role-heading"
              className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              Principal Architect
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Revenue-critical media, monetization, and platform systems
            </p>
            <p className="mt-2 font-mono text-xs text-brand-dark dark:text-brand-light">
              2022–Present · Employer anonymized
            </p>
          </div>
          <div>
            <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
              Set technical direction across consumer, advertising,
              monetization, partner, and platform concerns in a mature product
              environment.
            </p>
            <ul className="mt-8 grid gap-x-8 gap-y-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
              {[
                "Establish system boundaries, architecture standards, and sequencing for cross-team work.",
                "Align product goals with infrastructure, reliability, cost, and revenue consequences.",
                "Lead design review, migrations, and reliability programs while unblocking senior engineers.",
                "Stay close to critical implementation paths and production operations to validate the design.",
                "Work across advertising and monetization surfaces, search and delivery, partner integrations, and creative products.",
                "Treat observability, incident response, developer experience, and delivery pressure as architectural inputs.",
              ].map((item) => (
                <li
                  key={item}
                  className="border-t border-zinc-200 pt-4 dark:border-zinc-700/60"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-24" aria-labelledby="recent-heading">
        <div className="max-w-3xl">
          <SectionLabel>Recent relevant experience</SectionLabel>
          <h2
            id="recent-heading"
            className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            Scope, ownership, and outcomes - not a framework inventory.
          </h2>
        </div>
        <div className="mt-10">
          {recentExperience.map((entry) => (
            <ExperienceCard key={`${entry.title}-${entry.dates}`} entry={entry} />
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-24" aria-labelledby="systems-heading">
        <SectionLabel>Selected systems</SectionLabel>
        <h2
          id="systems-heading"
          className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          Current work that makes the operating model visible.
        </h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <article className="border-l-2 border-brand-dark pl-6 dark:border-brand-light sm:pl-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light">
              Creator + system owner
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              The House / Influence
            </h3>
            <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">
              A production AI-agent platform spanning persistent identity,
              OAuth and MCP permissions, multiplayer orchestration, durable event
              history, replay, analysis, infrastructure, and operations.
            </p>
            <div className="mt-6">
              <ArrowLink href="/~/projects#the-house">Read the case study</ArrowLink>
            </div>
          </article>
          <article className="border-l-2 border-zinc-300 pl-6 dark:border-zinc-700 sm:pl-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Selected Web3 chapter
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Adversarial distributed systems
            </h3>
            <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">
              Smart contracts, collection migrations, ordinal tooling, and
              public protocols that demanded explicit trust, permission,
              signing, and permanence decisions.
            </p>
            <div className="mt-6">
              <ArrowLink href="/~/projects#supporting-work">
                Read the supporting work
              </ArrowLink>
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-24" aria-labelledby="earlier-heading">
        <div className="max-w-3xl">
          <SectionLabel>Earlier career</SectionLabel>
          <h2
            id="earlier-heading"
            className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            The platform changed. The job did not.
          </h2>
        </div>
        <div className="mt-10">
          {earlierExperience.map((entry) => (
            <ExperienceCard key={`${entry.title}-${entry.dates}`} entry={entry} />
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-24" aria-labelledby="capabilities-heading">
        <SectionLabel>Current technical capabilities</SectionLabel>
        <h2
          id="capabilities-heading"
          className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          Broad enough to connect the system. Current enough to build it.
        </h2>
        <dl className="mt-10 grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <div
              key={capability.title}
              className="border-zinc-200 py-7 sm:px-6 sm:[&:nth-child(even)]:border-l lg:border-l lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(n+4)]:border-t dark:border-zinc-700/60"
            >
              <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                {capability.title}
              </dt>
              <dd className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {capability.description}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-20" aria-labelledby="education-heading">
        <SectionLabel>Education</SectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-baseline">
          <h2
            id="education-heading"
            className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            Bachelor of Science in Computer Engineering
          </h2>
          <p className="font-mono text-xs text-brand-dark dark:text-brand-light">
            1995–2000
          </p>
        </div>
      </section>
    </Container>
  );
}
