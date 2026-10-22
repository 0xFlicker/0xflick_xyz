import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import { selectedWorkIds, type SelectedWorkId } from "@/lib/portfolio";
import { createPageMetadata, profileLinks } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Work",
  description:
    "Products and tools built or co-created by John Dean / Flick: The House, Morpheus, Shutterstock Editor and Create, and open-source libraries.",
  path: "/~/projects",
});

type Project = {
  id: SelectedWorkId;
  category: string;
  title: string;
  description: string;
  detail: string;
  links: readonly { href: string; label: string }[];
};

const projects: readonly Project[] = [
  {
    id: selectedWorkIds.theHouse,
    category: "AI game platform",
    title: "The House / Influence",
    description:
      "Influence puts persistent AI agents in a social-strategy game with public discussions, private alliances, and voting.",
    detail:
      "I built the platform around an event history that drives game state, replay, and analysis. Agents act through scoped OAuth and MCP tools, with access tied to ownership and game permissions.",
    links: [
      { href: "https://thehouse.game", label: "Visit The House" },
      { href: "https://github.com/0xFlicker/influence-game", label: "Source on GitHub" },
      { href: "https://github.com/0xFlicker/influence-game/blob/main/Design.md", label: "System design" },
    ],
  },
  {
    id: selectedWorkIds.morpheus,
    category: "Adventure game",
    title: "Morpheus",
    description:
      "A graphical adventure game modernized for the browser, with panoramas, video, audio, and interactive puzzles.",
    detail:
      "I modeled scenes, hotspots, triggers, and puzzle logic as data rather than separate scene implementations. The runtime has shipped across browser, Electron desktop, and PhoneGap mobile versions.",
    links: [
      { href: "https://www.soapbubble.xyz/", label: "Play Morpheus" },
      { href: "https://soapbubble.itch.io/morpheus", label: "Play on itch.io" },
      { href: "https://github.com/soap-bubble/web", label: "Source on GitHub" },
    ],
  },
  {
    id: selectedWorkIds.shutterstockEditor,
    category: "Creative software",
    title: "Shutterstock Editor",
    description:
      "A browser-based image editor built with React, HTML Canvas, WebGL, and Node.js.",
    detail:
      "I helped build the editor and led development of its partner SDK, making the editing tools available through partner integrations.",
    links: [
      { href: "/~/cv#shutterstock-2015", label: "Role and responsibilities" },
    ],
  },
  {
    id: selectedWorkIds.shutterstockCreate,
    category: "Creative software",
    title: "Shutterstock Create",
    description:
      "A browser-based creative product developed from PicMonkey after its acquisition.",
    detail:
      "I helped deliver Create and contributed to the team behind Shutterstock’s first AI image-editing tool.",
    links: [
      { href: "/~/cv#shutterstock-2022", label: "Role and responsibilities" },
    ],
  },
];

const openSource = [
  {
    title: "Mold / service-builder",
    description:
      "A functional dependency-injection library I created and helped release as open source.",
    href: "https://github.com/shutterstock/mold",
  },
  {
    title: "Clash of Clans API client",
    description:
      "A published Node.js client for the Clash of Clans API.",
    href: "https://github.com/CaptEmulation/clash-of-clans-api",
  },
  {
    title: "Screeps",
    description:
      "Autonomous game agents for Screeps.",
    href: "https://github.com/CaptEmulation/screeps-redux",
  },
  {
    title: "Ranker",
    description:
      "A serverless DynamoDB leaderboard with bounded top-N maintenance and exact rank resolution for any member.",
    href: "https://github.com/0xFlicker/ranker",
  },
  {
    title: "Inscriptions",
    description:
      "Published TypeScript tooling for Bitcoin Ordinals and inscriptions.",
    href: "https://github.com/flick-ing/inscriptions",
  },
  {
    title: "Fame contracts",
    description:
      "Smart contracts and migration infrastructure for Fame Lady Society.",
    href: "https://github.com/fame-lady-society/fame-contracts",
  },
] as const;

export default function ProjectsPage() {
  return (
    <Container className="mt-12 sm:mt-20">
      <header className="max-w-4xl border-b border-zinc-200 pb-10 dark:border-zinc-700/60 sm:pb-12">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-5xl dark:text-white">
          Things I’ve built.
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Products I’ve built or helped ship, plus open-source tools.
        </p>
        <nav aria-label="Projects" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {projects.map((project) => (
            <ArrowLink key={project.id} href={`#${project.id}`}>
              {project.title}
            </ArrowLink>
          ))}
          <ArrowLink href={`#${selectedWorkIds.openSource}`}>Open source</ArrowLink>
        </nav>
      </header>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
        {projects.map((project) => (
          <article key={project.id} id={project.id} className="scroll-mt-12 py-10 sm:py-14">
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <div>
                <SectionLabel>{project.category}</SectionLabel>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {project.title}
                </h2>
              </div>
              <div>
                <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                  {project.description}
                </p>
                <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
                  {project.detail}
                </p>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-4">
                  {project.links.map((link) => (
                    <ArrowLink key={link.href} href={link.href}>{link.label}</ArrowLink>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}

        <section id={selectedWorkIds.openSource} className="scroll-mt-12 py-10 sm:py-14">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Open-source tools
          </h2>
          <div className="mt-8 grid gap-x-12 sm:grid-cols-2">
            {openSource.map((project) => (
              <article key={project.title} className="border-t border-zinc-200 py-6 dark:border-zinc-700/60">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {project.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {project.description}
                </p>
                <div className="mt-4">
                  <ArrowLink href={project.href}>View {project.title} on GitHub</ArrowLink>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            <ArrowLink href={profileLinks.github}>0xFlicker on GitHub</ArrowLink>
            <ArrowLink href={profileLinks.originalGithub}>CaptEmulation on GitHub</ArrowLink>
            <ArrowLink href="/~/projects/archive">Onchain project archive</ArrowLink>
          </div>
        </section>
      </div>

      <div className="border-t border-zinc-200 pt-8 dark:border-zinc-700/60">
        <ArrowLink href="/~/cv">Career history and responsibilities</ArrowLink>
      </div>
    </Container>
  );
}
