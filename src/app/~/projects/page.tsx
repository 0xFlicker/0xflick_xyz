import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Selected systems and case studies",
  description:
    "Case studies in production AI agents, revenue-critical platforms, MLOps, streaming, and adversarial distributed systems led by Flick.",
  path: "/~/projects",
});

function ScopeList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700/60"
        >
          <span
            className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-dark dark:bg-brand-light"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function EvidenceGrid({
  items,
}: {
  items: readonly { label: string; description: string }[];
}) {
  return (
    <dl className="grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-zinc-200 py-6 sm:[&:nth-child(odd)]:pr-6 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-6 sm:[&:nth-child(n+3)]:border-t dark:border-zinc-700/60"
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light">
            {item.label}
          </dt>
          <dd className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const houseArchitecture = [
  {
    title: "Access + identity",
    description:
      "User accounts, agent ownership, persistent profiles, OAuth, and narrowly scoped permissions.",
  },
  {
    title: "Agent platform",
    description:
      "Standing agents, revisions, model and tool configuration, and continuity across competitions.",
  },
  {
    title: "Influence runtime",
    description:
      "Public discussion, private Mingle rooms, alliances, powers, voting, and long-running multiplayer execution.",
  },
  {
    title: "History + artifacts",
    description:
      "Canonical events drive replay, results, analysis read models, producer evidence, and post-game media.",
  },
  {
    title: "Production operations",
    description:
      "Web, API, PostgreSQL, background execution, render workers, storage, deployment, and observability.",
  },
] as const;

const employerCases = [
  {
    id: "platform-scale",
    eyebrow: "02 · Current Principal Architect scope",
    title: "Revenue-critical media and monetization systems",
    meta: "2022–Present · Employer anonymized",
    intro:
      "Technical direction across mature consumer, advertising, partner, and platform surfaces where architecture carries a revenue consequence.",
    evidence: [
      {
        label: "Context",
        description:
          "A mature consumer media platform spanning search, content delivery, creative tools, partner integrations, advertising, and monetization.",
      },
      {
        label: "Constraint",
        description:
          "New capability has to coexist with real traffic, operational ownership, delivery pressure, cost, and business-critical behavior.",
      },
      {
        label: "Intervention",
        description:
          "Set technical direction, establish boundaries and standards, align product and infrastructure decisions, review designs, and lead critical implementation paths.",
      },
      {
        label: "Scope",
        description:
          "Cross-team architecture, monetization and advertising surfaces, developer integrations, cloud operations, reliability, observability, and incident response.",
      },
      {
        label: "Outcome",
        description:
          "A coherent path for changing revenue-critical systems without treating reliability, operability, or delivery as somebody else’s problem.",
      },
    ],
  },
  {
    id: "ml-platform",
    eyebrow: "03 · ML operations platform",
    title: "Product-platform ownership inherited from the CTO",
    meta: "2020–2022 · Frontend Lead · Employer anonymized",
    intro:
      "Technical leadership for an enterprise MLOps product, carrying the customer-facing system through architecture, delivery, operations, and support.",
    evidence: [
      {
        label: "Context",
        description:
          "A startup product connecting model operations to enterprise customers through a web application, GraphQL layer, integrations, and delivery infrastructure.",
      },
      {
        label: "Constraint",
        description:
          "Frontend ownership moved from the CTO while product work, subcontractor coordination, operational integration, and customer commitments continued.",
      },
      {
        label: "Intervention",
        description:
          "Took technical ownership, set frontend direction, built orchestration layers for engineers, coordinated subcontractors, and connected product delivery to CI/CD and operations.",
      },
      {
        label: "Scope",
        description:
          "Marketing and product surfaces, GraphQL, enterprise customization, CI/CD, operational integrations, customer support, and production on-call.",
      },
      {
        label: "Outcome",
        description:
          "Converted a CTO-held product surface into a broader engineering capability with a clearer delivery and operational ownership model.",
      },
    ],
  },
] as const;

const supportingWork = [
  {
    title: "Web3 and adversarial distributed systems",
    meta: "Selected work published as 0xFlicker",
    details: [
      {
        label: "Why it was difficult",
        description:
          "Public state, irreversible execution, hostile inputs, wallet permissions, and protocol compatibility leave little room for hand-wavy boundaries.",
      },
      {
        label: "What I owned",
        description:
          "Smart contracts, NFT collection migrations, ordinal tooling, on-chain experiments, product surfaces, and operational handoffs.",
      },
      {
        label: "Judgment required",
        description:
          "Balance permanence with upgrade paths, minimize trust, make signing legible, and choose where on-chain execution buys enough to justify the cost.",
      },
      {
        label: "What it demonstrates",
        description:
          "Practical security thinking, permission design, distributed-state reasoning, developer ergonomics, and respect for irreversible failure.",
      },
    ],
  },
  {
    title: "Streaming, embedded, and consumer platforms",
    meta: "Earlier platform work · 2000–2020",
    details: [
      {
        label: "Why it was difficult",
        description:
          "Constrained devices, remote-control interfaces, live streams, payments, scheduling, performance ceilings, and visible consumer failures shared the same systems.",
      },
      {
        label: "What I owned",
        description:
          "Embedded testing, smartphone SDK tooling, mobile consulting, streaming interfaces, and a multiplayer live-event web platform.",
      },
      {
        label: "Judgment required",
        description:
          "Choose abstractions that fit the runtime, protect performance and memory, and deliver product behavior across unreliable boundaries.",
      },
      {
        label: "What it demonstrates",
        description:
          "The career throughline: learn the platform beneath the framework and ship systems people can use and teams can operate.",
      },
    ],
  },
] as const;

export default function ProjectsPage() {
  return (
    <Container className="mt-16 sm:mt-28">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <SectionLabel>Selected systems</SectionLabel>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          Architecture with receipts.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          The work below is organized around system context, constraints,
          ownership, decisions, and operational consequences - not capability
          cards wearing tiny neckties.
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Selected employer work is described in generalized terms to respect
          confidentiality.
        </p>
      </header>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
        <article id="the-house" className="scroll-mt-24 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <SectionLabel>01 · Public AI platform</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                The House / Influence
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                The House is the platform. Influence is its first production
                game.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4">
                <ArrowLink href="https://thehouse.game">Open The House</ArrowLink>
                <ArrowLink href="https://github.com/0xFlicker/influence-game">
                  Inspect the source
                </ArrowLink>
                <ArrowLink href="https://github.com/0xFlicker/influence-game/blob/main/Design.md">
                  Read the system design
                </ArrowLink>
              </div>
            </div>

            <div>
              <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                A platform for persistent AI agents to enter social-strategy
                competitions, communicate across public and private spaces, act
                through scoped tools, and leave behind a durable record that can
                be replayed and analyzed.
              </p>

              <div className="mt-12 grid gap-10 sm:grid-cols-2">
                <section aria-labelledby="house-problem">
                  <h3
                    id="house-problem"
                    className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                  >
                    Product problem
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Agent demos usually end at the chat boundary. The House has
                    to make agents legible as durable participants: identity,
                    history, permissions, competition state, private strategy,
                    public behavior, and evidence after the game.
                  </p>
                </section>
                <section aria-labelledby="house-ownership">
                  <h3
                    id="house-ownership"
                    className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                  >
                    Ownership
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    I created and own the platform end to end: product model,
                    agent and game orchestration, frontend, API, identity and
                    permissions, MCP surfaces, infrastructure, deployment,
                    operations, analysis, replay, and post-game media.
                  </p>
                </section>
              </div>

              <section className="mt-12" aria-labelledby="architecture-heading">
                <h3
                  id="architecture-heading"
                  className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                >
                  System architecture
                </h3>
                <ol className="mt-6 rounded-2xl bg-brand-light/20 p-6 dark:bg-brand-dark/20 sm:p-8">
                  {houseArchitecture.map((layer, index) => (
                    <li
                      key={layer.title}
                      className="grid gap-3 border-b border-brand-dark/15 py-5 first:pt-0 last:border-b-0 last:pb-0 dark:border-brand-light/20 sm:grid-cols-[3rem_0.65fr_1.35fr]"
                    >
                      <span className="font-mono text-[10px] text-brand-dark dark:text-brand-light">
                        0{index + 1}
                      </span>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {layer.title}
                      </h4>
                      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {layer.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-12" aria-labelledby="constraints-heading">
                <h3
                  id="constraints-heading"
                  className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                >
                  Unusual constraints
                </h3>
                <div className="mt-6">
                  <ScopeList
                    items={[
                      "Persistent agent identity without freezing agent behavior forever",
                      "OAuth scopes and MCP tool boundaries that reflect real ownership",
                      "Public rooms, private communication, and producer-only evidence",
                      "Long-running multiplayer orchestration with durable recovery",
                      "Canonical event history for replay, results, and auditability",
                      "Model-generated behavior without treating model memory as system state",
                    ]}
                  />
                </div>
              </section>

              <section className="mt-12" aria-labelledby="decisions-heading">
                <h3
                  id="decisions-heading"
                  className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                >
                  Architectural decisions
                </h3>
                <div className="mt-6">
                  <EvidenceGrid
                    items={[
                      {
                        label: "Platform before game",
                        description:
                          "The House owns agent identity, permissions, competitions, and artifacts; Influence owns the social-strategy rules.",
                      },
                      {
                        label: "Events before summaries",
                        description:
                          "Replay, results, analysis, and recovery derive from accepted canonical events rather than an opaque transcript.",
                      },
                      {
                        label: "Audience-shaped access",
                        description:
                          "Public watchers, agent owners, and producers receive different read and action surfaces instead of one privileged API.",
                      },
                      {
                        label: "Artifacts from durable state",
                        description:
                          "Post-game analysis and media are generated from the recorded game, making the output addressable and reviewable.",
                      },
                    ]}
                  />
                </div>
              </section>

              <section className="mt-12 border-l-2 border-brand-dark pl-6 dark:border-brand-light sm:pl-8" aria-labelledby="running-heading">
                <h3
                  id="running-heading"
                  className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                >
                  Running today
                </h3>
                <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-300">
                  The public product, persistent agent profiles, competition
                  entry, durable game execution, spectator and results surfaces,
                  OAuth-protected MCP tools, replay and analysis models, and the
                  post-game media pipeline are implemented and deployed.
                </p>
              </section>
            </div>
          </div>
        </article>

        {employerCases.map((caseStudy) => (
          <article
            key={caseStudy.id}
            id={caseStudy.id}
            className="scroll-mt-24 py-16 sm:py-24"
          >
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div>
                <SectionLabel>{caseStudy.eyebrow}</SectionLabel>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {caseStudy.title}
                </h2>
                <p className="mt-3 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                  {caseStudy.meta}
                </p>
              </div>
              <div>
                <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                  {caseStudy.intro}
                </p>
                <div className="mt-10">
                  <EvidenceGrid items={caseStudy.evidence} />
                </div>
              </div>
            </div>
          </article>
        ))}

        <section id="supporting-work" className="scroll-mt-24 py-16 sm:py-24">
          <div className="max-w-3xl">
            <SectionLabel>04 · Supporting work</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Different platforms. The same engineering judgment.
            </h2>
          </div>
          <div className="mt-12 space-y-16">
            {supportingWork.map((work) => (
              <article
                key={work.title}
                className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20"
              >
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {work.title}
                  </h3>
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {work.meta}
                  </p>
                </div>
                <EvidenceGrid items={work.details} />
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4">
            <ArrowLink href="https://github.com/fame-lady-society/fame-contracts">
              FAME contracts
            </ArrowLink>
            <ArrowLink href="https://github.com/flick-ing/inscriptions">
              Inscriptions library
            </ArrowLink>
            <ArrowLink href="/~/projects/archive">
              Browse the internal project archive
            </ArrowLink>
          </div>
        </section>
      </div>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <SectionLabel>The standard</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Architecture earns its keep in production.
            </h2>
            <p className="mt-5 leading-7 text-zinc-600 dark:text-zinc-300">
              It has to survive permissions, latency, cost, reliability,
              migrations, delivery pressure, and the team operating it after the
              diagram is forgotten.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <ArrowLink href="/~/cv">View experience</ArrowLink>
            <ArrowLink href="/connect">Connect</ArrowLink>
          </div>
        </div>
      </section>
    </Container>
  );
}
