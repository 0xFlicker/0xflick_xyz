import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";

export const metadata: Metadata = {
  title: "Selected work",
  description:
    "Selected AI, platform, product, and distributed-systems work by Flick.",
};

function ScopeList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700/60">
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

const houseFlow = [
  {
    title: "Agents",
    description: "Autonomous participants reason, negotiate, and act.",
  },
  {
    title: "Platform",
    description: "Orchestration, identity, tools, and scoped permissions.",
  },
  {
    title: "Runtime",
    description: "Multiplayer state, social dynamics, and game execution.",
  },
  {
    title: "Artifacts",
    description: "Deterministic analysis, results, and highlight media.",
  },
] as const;

export default function ProjectsPage() {
  return (
    <Container className="mt-16 sm:mt-28">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <SectionLabel>Selected work</SectionLabel>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          Systems with users, constraints, and an operations story.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          This is a curated view of the work that best explains how I operate:
          current AI-agent infrastructure, mature consumer platforms, ML
          product delivery, and distributed systems published as 0xFlicker.
          Employer-sensitive work stays deliberately high level.
        </p>
      </header>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
        <article id="the-house" className="scroll-mt-24 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <SectionLabel>01 · Independent AI platform</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                The House
              </h2>
              <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Active · Independent product, not an employer
              </p>
            </div>
            <div>
              <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                An AI social-strategy platform where autonomous agents compete,
                negotiate, form alliances, and produce a deterministic account
                of the game after it ends.
              </p>
              <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-300">
                I own the system end to end: the product model, agent and game
                orchestration, frontend and backend, MCP integrations, OAuth
                and scoped permissions, infrastructure, deployment, operations,
                and post-game analysis and highlight artifacts. It is a
                production system with real users—not a chat wrapper wearing a
                jaunty hat.
              </p>
              <div className="mt-10 rounded-2xl bg-brand-light/20 p-6 dark:bg-brand-dark/20 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  System shape
                </p>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                  {houseFlow.map((step, index) => (
                    <li
                      key={step.title}
                      className="border-l border-brand-dark/40 pl-4 dark:border-brand-light/50"
                    >
                      <p className="font-mono text-[10px] text-brand-dark dark:text-brand-light">
                        0{index + 1}
                      </p>
                      <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {step.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-10">
                <ScopeList
                  items={[
                    "Agent orchestration and multiplayer game runtime",
                    "Alliance, negotiation, and social-strategy systems",
                    "MCP integration, OAuth, and scoped permissions",
                    "Frontend, backend, API, infrastructure, and operations",
                    "Deterministic post-game analysis and highlight artifacts",
                    "Production deployment and active product iteration",
                  ]}
                />
              </div>
            </div>
          </div>
        </article>

        <article id="platform-scale" className="scroll-mt-24 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <SectionLabel>02 · Internet-scale media</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Mature platforms under real traffic
              </h2>
              <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Employer name intentionally withheld pending review
              </p>
            </div>
            <div>
              <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                Long-running work across search, content delivery, creative
                tools, partner surfaces, monetization, and the operations behind
                a high-traffic consumer platform.
              </p>
              <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-300">
                The useful story here is not one framework or launch. It is
                making changes inside a mature system where product behavior,
                reliability, cost, revenue, integrations, and on-call ownership
                all constrain the architecture.
              </p>
              <div className="mt-10">
                <ScopeList
                  items={[
                    "Search and content-delivery systems",
                    "Creative tools and developer-facing integrations",
                    "Advertising and monetization surfaces",
                    "Cloud and Kubernetes operations",
                    "Reliability, observability, and incident response",
                    "Cost-aware architecture and mature-system change",
                  ]}
                />
              </div>
            </div>
          </div>
        </article>

        <article id="ml-platform" className="scroll-mt-24 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <SectionLabel>03 · ML operations startup</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Technical ownership at the product-platform boundary
              </h2>
            </div>
            <div>
              <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                Frontend technical leadership for an enterprise machine-learning
                operations product, taking ownership of the surface from the CTO
                and carrying it through delivery and operations.
              </p>
              <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-300">
                The role crossed the marketing site, product application,
                GraphQL layer, frontend orchestration, subcontractor leadership,
                CI/CD, operational integrations, enterprise customization, and
                customer-facing support. It was platform work expressed through
                a product, not frontend as a decorative afterthought.
              </p>
              <div className="mt-10">
                <ScopeList
                  items={[
                    "Frontend architecture and technical direction",
                    "Ownership transition from the CTO",
                    "Product and GraphQL delivery",
                    "Subcontractor coordination",
                    "CI/CD and operations integrations",
                    "Enterprise support and production on-call",
                  ]}
                />
              </div>
            </div>
          </div>
        </article>

        <article id="onchain-systems" className="scroll-mt-24 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <SectionLabel>04 · Published as 0xFlicker</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                On-chain systems and developer tools
              </h2>
            </div>
            <div>
              <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
                A curated body of work in smart contracts, digital ownership,
                decentralized identity, protocol tooling, migrations, and
                programs designed for adversarial public infrastructure.
              </p>
              <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-300">
                This work includes Fame Lady Society contracts and on-chain
                systems, Bitflick ordinal inscription tooling, NFT collection
                migrations, and experiments with JavaScript executed entirely
                on-chain. It belongs in the portfolio because it sharpened the
                same engineering muscles: trust boundaries, permanence,
                distributed state, developer ergonomics, and operational risk.
              </p>
              <div className="mt-10">
                <ScopeList
                  items={[
                    "Smart contracts and protocol design",
                    "Digital ownership and decentralized identity",
                    "Collection migration systems",
                    "Ordinal inscription tooling",
                    "On-chain JavaScript experiments",
                    "Public, adversarial operating environments",
                  ]}
                />
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                <ArrowLink href="https://fameladysociety.com">
                  Fame Lady Society
                </ArrowLink>
                <ArrowLink href="https://www.bitflick.xyz">
                  Bitflick
                </ArrowLink>
                <ArrowLink href="/~/projects/archive">
                  Browse the project archive
                </ArrowLink>
              </div>
            </div>
          </div>
        </article>
      </div>

      <section className="border-t border-zinc-200 py-16 dark:border-zinc-700/60 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <SectionLabel>The throughline</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Architecture earns its keep in production.
            </h2>
            <p className="mt-5 leading-7 text-zinc-600 dark:text-zinc-300">
              Across these systems, I work where product, platform,
              infrastructure, and operations meet. That is where elegant boxes
              on a diagram encounter permissions, latency, cost, users, and
              Tuesday afternoon.
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
