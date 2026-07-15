import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import {
  formatCareerDateRange,
  getCareerRole,
  type CareerRoleId,
} from "@/lib/career";
import {
  selectedWorkIds,
  type SelectedWorkId,
} from "@/lib/portfolio";
import { createPageMetadata, profileLinks } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Selected work",
  description:
    "Selected systems built and operated by John Dean / Flick: The House, GIPHY, Shutterstock Create, Shutterstock Editor, Verta, Morpheus, and open-source work.",
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
  [
    "Access + identity",
    "User accounts, agent ownership, persistent profiles, OAuth, and narrowly scoped permissions.",
  ],
  [
    "Agent platform",
    "Standing agents, revisions, model and tool configuration, and continuity across competitions.",
  ],
  [
    "Influence runtime",
    "Public discussion, private rooms, alliances, powers, voting, and long-running multiplayer execution.",
  ],
  [
    "History + artifacts",
    "Canonical events drive replay, results, analysis, producer evidence, and post-game media.",
  ],
  [
    "Production operations",
    "Web, API, PostgreSQL, background and render workers, storage, deployment, and observability.",
  ],
] as const;

type WorkStory = {
  id: SelectedWorkId;
  eyebrow: string;
  title: string;
  careerRoleId?: CareerRoleId;
  meta?: string;
  intro: string;
  evidence: readonly { label: string; description: string }[];
  links?: readonly { href: string; label: string }[];
};

function getWorkStoryMeta(story: WorkStory) {
  if (!story.careerRoleId) return story.meta;

  const role = getCareerRole(story.careerRoleId);
  return [
    role.displayTitle,
    role.company === story.title ? undefined : role.company,
    formatCareerDateRange(role),
    role.officialTitle && role.officialTitle !== role.displayTitle
      ? `Official title: ${role.officialTitle}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

const workStories: readonly WorkStory[] = [
  {
    id: selectedWorkIds.giphy,
    eyebrow: "02 · Current role",
    title: "GIPHY",
    careerRoleId: "giphy-2024",
    intro:
      "Set technical direction across GIPHY’s monetization, advertising, search, delivery, partner, API, and platform systems.",
    evidence: [
      {
        label: "Context",
        description:
          "A mature consumer media product where revenue systems, search, content delivery, partner surfaces, and platform concerns meet.",
      },
      {
        label: "Scope",
        description:
          "Architecture, design review, migrations, reliability, operational ownership, infrastructure cost, and hands-on validation of critical paths.",
      },
      {
        label: "Operating constraints",
        description:
          "New work must coexist with product behavior, delivery pressure, existing integrations, and the reliability expectations of a high-traffic platform.",
      },
      {
        label: "Work delivered",
        description:
          "Technical direction and implementation review for changes across monetization, consumer, partner, and platform systems. Public metrics are intentionally omitted until verified.",
      },
    ],
  },
  {
    id: selectedWorkIds.shutterstockCreate,
    eyebrow: "03 · Creative platform",
    title: "Shutterstock Create",
    careerRoleId: "shutterstock-2022",
    intro:
      "Returned to Shutterstock after the PicMonkey acquisition to help integrate and evolve the company’s browser-based creative platform.",
    evidence: [
      {
        label: "Product",
        description:
          "Browser-based creative tooling brought into Shutterstock and developed into Shutterstock Create.",
      },
      {
        label: "Scope",
        description:
          "Product engineering, cloud infrastructure, Kubernetes, deployment, production support, and integration with the broader Shutterstock product environment.",
      },
      {
        label: "Shipped result",
        description:
          "Helped deliver Shutterstock Create and transition away from the previous Shutterstock Editor platform.",
      },
      {
        label: "Career context",
        description:
          "Returned with broader startup, multiplayer product, and MLOps experience than during the first Shutterstock tenure.",
      },
    ],
  },
  {
    id: selectedWorkIds.shutterstockEditor,
    eyebrow: "04 · Creative product + marketplace",
    title: "Shutterstock Editor",
    careerRoleId: "shutterstock-2015",
    intro:
      "Helped build Shutterstock’s browser-based image editor while also contributing to the core marketplace and its production operations.",
    evidence: [
      {
        label: "Product",
        description:
          "A full-stack creative application built with JavaScript, React, HTML Canvas, WebGL, and Node.js.",
      },
      {
        label: "Lead work",
        description:
          "Led internationalization, partner SDK development, and the application’s migration to AWS and Kubernetes.",
      },
      {
        label: "Marketplace",
        description:
          "Contributed to cart, checkout, product features, and legacy Perl-to-Node modernization on the core Shutterstock platform.",
      },
      {
        label: "Operations",
        description:
          "Shared rotating 24/7 production on-call responsibility for product surfaces used by real customers and partners.",
      },
    ],
  },
  {
    id: selectedWorkIds.verta,
    eyebrow: "05 · Enterprise MLOps",
    title: "Verta",
    careerRoleId: "verta-2020",
    intro:
      "Took over customer-facing product and frontend ownership from the CTO for an enterprise model-management platform.",
    evidence: [
      {
        label: "Product",
        description:
          "A React and GraphQL application connecting enterprise users to model-management and operations workflows.",
      },
      {
        label: "Ownership",
        description:
          "Designed and built web features, wrote GraphQL resolvers against backend APIs, and maintained tests, builds, and releases.",
      },
      {
        label: "Leadership",
        description:
          "Led three overseas frontend contractors and expanded customer-facing product ownership beyond the CTO.",
      },
      {
        label: "Operations",
        description:
          "Contributed to CI/CD, operations integrations, enterprise customization, customer support, delivery, and production on-call.",
      },
    ],
  },
  {
    id: selectedWorkIds.morpheus,
    eyebrow: "06 · Archived game modernization",
    title: "Morpheus",
    meta: "Cross-platform modernization and software preservation",
    intro:
      "A six-to-eight-year effort to modernize a late-1990s graphical adventure game through a data-driven runtime and multiple distribution targets.",
    evidence: [
      {
        label: "Runtime",
        description:
          "Modeled panoramas, video, audio, hotspots, state, triggers, and puzzle logic as data rather than one-off scene code.",
      },
      {
        label: "Distribution",
        description:
          "Shipped through browser, Electron desktop, PhoneGap mobile, and later Next.js experiments across the project’s active years.",
      },
      {
        label: "Technical record",
        description:
          "Public source, tags, commits, and development records survive across the Soap Bubble organization.",
      },
      {
        label: "Current status",
        description:
          "Archived. The original backend, cloud environment, and domain are unavailable, so historical distributed builds are not presented as functional or supported.",
      },
    ],
    links: [
      {
        href: "https://github.com/soap-bubble/web",
        label: "Inspect the Morpheus source archive on GitHub",
      },
    ],
  },
] as const;

const openSource = [
  {
    title: "Mold / service-builder",
    description:
      "A functional dependency-injection library I created for internal Shutterstock use and later helped release as open source.",
    href: "https://github.com/shutterstock/mold",
    account: "shutterstock/mold",
  },
  {
    title: "Clash of Clans API client",
    description:
      "An older published Node.js API library with external use, preserved on my original professional account.",
    href: "https://github.com/CaptEmulation/clash-of-clans-api",
    account: "CaptEmulation",
  },
  {
    title: "Screeps",
    description:
      "Autonomous game-agent work that began in the CaptEmulation chapter and continues to inform current agent-system work.",
    href: "https://github.com/CaptEmulation/screeps-redux",
    account: "CaptEmulation",
  },
  {
    title: "Ranker",
    description:
      "A serverless DynamoDB leaderboard with bounded top-N maintenance and exact rank resolution for any member.",
    href: "https://github.com/0xFlicker/ranker",
    account: "0xFlicker",
  },
  {
    title: "Inscriptions",
    description:
      "Published TypeScript tooling for Bitcoin Ordinals and inscriptions.",
    href: "https://github.com/flick-ing/inscriptions",
    account: "flick-ing",
  },
  {
    title: "Fame contracts",
    description:
      "Smart contracts and migration infrastructure for Fame Lady Society.",
    href: "https://github.com/fame-lady-society/fame-contracts",
    account: "fame-lady-society",
  },
] as const;

export default function ProjectsPage() {
  return (
    <Container className="mt-16 sm:mt-28">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <SectionLabel>Selected work</SectionLabel>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          Systems I’ve built, changed, and operated.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Named products, public-safe scope, and concrete shipped work. No
          invented metrics and no need for every project to cosplay as a case
          study.
        </p>
      </header>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
        <article
          id={selectedWorkIds.theHouse}
          className="scroll-mt-24 py-16 sm:py-24"
        >
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <SectionLabel>01 · Current independent flagship</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                The House / Influence
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                The House is the platform. Influence is its first production
                game.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4">
                <ArrowLink href="https://thehouse.game">
                  Open The House live product
                </ArrowLink>
                <ArrowLink href="https://github.com/0xFlicker/influence-game">
                  Inspect influence-game on GitHub
                </ArrowLink>
                <ArrowLink href="https://github.com/0xFlicker/influence-game/blob/main/Design.md">
                  Read The House system design
                </ArrowLink>
              </div>
            </div>

            <div>
              <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                A platform for persistent AI agents to enter social-strategy
                competitions, communicate in public and private, act through
                scoped tools, and leave behind a durable record for replay and
                analysis.
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
                    Agent demos usually stop at chat. The House has to make
                    agents durable participants with identity, ownership,
                    permissions, private strategy, public behavior, game state,
                    and evidence after play.
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
                    I build and operate the platform end to end: product model,
                    game orchestration, frontend, API, OAuth, MCP, permissions,
                    infrastructure, deployment, replay, analysis, and post-game
                    media.
                  </p>
                </section>
              </div>

              <section className="mt-12" aria-labelledby="architecture-heading">
                <h3
                  id="architecture-heading"
                  className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                >
                  System shape
                </h3>
                <ol className="mt-6 rounded-2xl bg-brand-light/20 p-6 dark:bg-brand-dark/20 sm:p-8">
                  {houseArchitecture.map(([title, description], index) => (
                    <li
                      key={title}
                      className="grid gap-3 border-b border-brand-dark/15 py-5 first:pt-0 last:border-b-0 last:pb-0 dark:border-brand-light/20 sm:grid-cols-[3rem_0.65fr_1.35fr]"
                    >
                      <span className="font-mono text-[10px] text-brand-dark dark:text-brand-light">
                        0{index + 1}
                      </span>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {title}
                      </h4>
                      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {description}
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
                  Production constraints
                </h3>
                <div className="mt-6">
                  <ScopeList
                    items={[
                      "Persistent agent identity without freezing behavior forever",
                      "OAuth scopes and MCP tools that reflect real ownership",
                      "Public rooms, private communication, and audience-shaped evidence",
                      "Long-running multiplayer orchestration with durable recovery",
                      "Canonical events for replay, results, and analysis",
                      "Model-generated behavior without treating model memory as system state",
                    ]}
                  />
                </div>
              </section>
            </div>
          </div>
        </article>

        {workStories.map((story) => (
          <article
            key={story.id}
            id={story.id}
            className="scroll-mt-24 py-16 sm:py-24"
          >
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div>
                <SectionLabel>{story.eyebrow}</SectionLabel>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {story.title}
                </h2>
                <p className="mt-3 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                  {getWorkStoryMeta(story)}
                </p>
                {story.links && (
                  <div className="mt-7 flex flex-col items-start gap-4">
                    {story.links.map((link) => (
                      <ArrowLink key={link.href} href={link.href}>
                        {link.label}
                      </ArrowLink>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                  {story.intro}
                </p>
                <div className="mt-10">
                  <EvidenceGrid items={story.evidence} />
                </div>
              </div>
            </div>
          </article>
        ))}

        <section
          id={selectedWorkIds.openSource}
          className="scroll-mt-24 py-16 sm:py-24"
        >
          <div className="max-w-3xl">
            <SectionLabel>07 · Selected open source</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              CaptEmulation → 0xFlicker
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              The account changed; the engineering history did not. This is a
              compact selection with architectural signal, not a repository
              directory.
            </p>
          </div>
          <div className="mt-12 grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2">
            {openSource.map((project) => (
              <article
                key={project.title}
                className="border-zinc-200 py-7 sm:[&:nth-child(odd)]:pr-7 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-7 sm:[&:nth-child(n+3)]:border-t dark:border-zinc-700/60"
              >
                <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  {project.account}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {project.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {project.description}
                </p>
                <div className="mt-5">
                  <ArrowLink href={project.href}>
                    Open {project.title} on GitHub
                  </ArrowLink>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            <ArrowLink href={profileLinks.github}>
              Browse 0xFlicker on GitHub
            </ArrowLink>
            <ArrowLink href={profileLinks.originalGithub}>
              Browse CaptEmulation on GitHub
            </ArrowLink>
            <ArrowLink href="/~/projects/archive">
              Browse the 0xFlicker / onchain project archive
            </ArrowLink>
          </div>
        </section>
      </div>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <SectionLabel>Next</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              View the full career sequence or start a conversation.
            </h2>
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
