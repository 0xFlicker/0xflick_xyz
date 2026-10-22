import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import {
  formatCareerDateRange,
  getCareerRole,
  getCareerRoleLabel,
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
    getCareerRoleLabel(role),
    role.company === story.title ? undefined : role.company,
    formatCareerDateRange(role),
  ]
    .filter(Boolean)
    .join(" · ");
}

const workStories: readonly WorkStory[] = [
  {
    id: selectedWorkIds.giphy,
    eyebrow: "Current role",
    title: "GIPHY",
    careerRoleId: "giphy-2024",
    intro:
      "Lead architecture and implementation across GIPHY’s monetization and advertising systems, alongside search, delivery, partner, API, and platform work.",
    evidence: [
      {
        label: "Targeting",
        description:
          "Introduced privacy-conscious targeting using ethically sourced data, designed around global privacy regulations and existing integrations.",
      },
      {
        label: "Advertising networks",
        description:
          "Built systems spanning partner sales channels and GIPHY’s consumer product, creating new revenue channels while managing reliability and infrastructure cost.",
      },
    ],
  },
  {
    id: selectedWorkIds.shutterstockCreate,
    eyebrow: "Creative platform",
    title: "Shutterstock Create",
    careerRoleId: "shutterstock-2022",
    intro:
      "Returned to Shutterstock after the PicMonkey acquisition to help integrate and evolve the company’s browser-based creative platform.",
    evidence: [
      {
        label: "Scope",
        description:
          "Product engineering, cloud infrastructure, Kubernetes, deployment, production support, and integration with the broader Shutterstock product environment.",
      },
      {
        label: "Shipped result",
        description:
          "Helped deliver Shutterstock Create, contributed to its first AI image-editing capability, and transitioned away from the previous Shutterstock Editor platform.",
      },
    ],
  },
  {
    id: selectedWorkIds.shutterstockEditor,
    eyebrow: "Creative product + marketplace",
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
    eyebrow: "Enterprise MLOps",
    title: "Verta",
    careerRoleId: "verta-2020",
    intro:
      "Joined as employee #6 and took over everything that touched the browser for an enterprise model-management platform.",
    evidence: [
      {
        label: "Product",
        description:
          "A React and GraphQL application connecting enterprise users to model-management and operations workflows.",
      },
      {
        label: "Ownership",
        description:
          "Owned browser-facing work end to end: web features, GraphQL resolvers, backend API integrations, tests, builds, and releases.",
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
    eyebrow: "Cross-platform adventure game",
    title: "Morpheus",
    meta: "Cross-platform game modernization",
    intro:
      "A data-driven graphical adventure game modernized for the browser after a long-running cross-platform development effort.",
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
        label: "Source",
        description:
          "Public source, tags, commits, and development records span the Soap Bubble organization.",
      },
      {
        label: "Current status",
        description:
          "Playable in the browser at SoapBubble.xyz and on itch.io.",
      },
    ],
    links: [
      {
        href: "https://www.soapbubble.xyz/",
        label: "Play Morpheus at SoapBubble.xyz",
      },
      {
        href: "https://soapbubble.itch.io/morpheus",
        label: "Play Morpheus on itch.io",
      },
      {
        href: "https://github.com/soap-bubble/web",
        label: "Inspect the Morpheus source on GitHub",
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
    <Container className="mt-12 sm:mt-20">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          Selected work.
        </h1>
        <nav aria-label="Projects" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          <ArrowLink href={`#${selectedWorkIds.theHouse}`}>The House</ArrowLink>
          {workStories.map((story) => (
            <ArrowLink key={story.id} href={`#${story.id}`}>{story.title}</ArrowLink>
          ))}
          <ArrowLink href={`#${selectedWorkIds.openSource}`}>Open source</ArrowLink>
        </nav>
      </header>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
        <article
          id={selectedWorkIds.theHouse}
          className="scroll-mt-24 py-16 sm:py-24"
        >
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <SectionLabel>Independent project</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                The House / Influence
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                AI agents competing in social-strategy games.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4">
                <ArrowLink href="https://thehouse.game">
                  Visit The House
                </ArrowLink>
                <ArrowLink href="https://github.com/0xFlicker/influence-game">
                  Source on GitHub
                </ArrowLink>
                <ArrowLink href="https://github.com/0xFlicker/influence-game/blob/main/Design.md">
                  System design
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
                    The game
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    In Influence, agents hold public discussions, form private
                    alliances, and vote. Their identities persist across games;
                    each game keeps its own state and event history.
                  </p>
                </section>
                <section aria-labelledby="house-ownership">
                  <h3
                    id="house-ownership"
                    className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark dark:text-brand-light"
                  >
                    My work
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    I build and operate the product, API, game runtime, and
                    infrastructure. Scoped OAuth and MCP tools control agent
                    access; canonical events drive replay and post-game analysis.
                  </p>
                </section>
              </div>

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
            <SectionLabel>Open source</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Libraries, games, and protocols
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              Published as 0xFlicker and, earlier, CaptEmulation.
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
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Want to know more?
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
