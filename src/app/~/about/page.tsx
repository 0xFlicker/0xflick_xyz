import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/PortfolioUI";
import { GitHubIcon, XIcon } from "@/components/SocialIcons";
import markImage from "@/images/avatar.png";
import { createPageMetadata } from "@/lib/site";
import { FlickImage } from "./FlickImage";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "How Flick leads: technical direction, cross-team architecture, operational ownership, mentorship, and hands-on production engineering.",
  path: "/~/about",
});

function MailIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  );
}

function SocialLink({
  href,
  children,
  icon: Icon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <li className={clsx("flex", className)}>
      <Link
        href={href}
        className="group flex items-center text-sm font-medium text-zinc-700 outline-offset-4 transition hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:text-zinc-200 dark:hover:text-brand-light dark:focus-visible:outline-brand-light"
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        <Icon className="h-5 w-5 flex-none fill-zinc-400 transition group-hover:fill-brand-dark dark:fill-zinc-500 dark:group-hover:fill-brand-light" />
        <span className="ml-3">{children}</span>
      </Link>
    </li>
  );
}

const careerArc = [
  {
    era: "Embedded systems",
    description:
      "Factory and SDK testing taught me to respect hardware, constrained runtimes, failure modes, and the people using the tools.",
  },
  {
    era: "Smartphones + mobile",
    description:
      "Early smartphone tools and client mobile systems made developer ergonomics, portability, and platform change part of the daily work.",
  },
  {
    era: "Streaming + consumer",
    description:
      "Interactive television, online video, multiplayer experiences, and creative products brought visible customer, performance, and revenue consequences.",
  },
  {
    era: "Cloud + MLOps",
    description:
      "Cloud platforms, MLOps, Kubernetes, CI/CD, observability, and on-call ownership made operability part of the architecture - not a handoff.",
  },
  {
    era: "Web3 + AI agents",
    description:
      "Adversarial public systems sharpened trust boundaries; production agent platforms now combine identity, permissions, durable state, multiplayer orchestration, and developer tools.",
  },
] as const;

const leadershipPractice = [
  {
    title: "Technical direction",
    description:
      "Turn an ambiguous goal into boundaries, standards, sequencing, and decisions the team can actually build against.",
  },
  {
    title: "Cross-team architecture",
    description:
      "Align product, infrastructure, security, operations, and business constraints before they become production archaeology.",
  },
  {
    title: "Mentorship + design review",
    description:
      "Review designs, challenge hidden assumptions, and unblock senior engineers without becoming a human approval queue.",
  },
  {
    title: "Operational ownership",
    description:
      "Treat reliability, observability, incident learning, migration safety, and cost as architectural inputs from the start.",
  },
  {
    title: "Hands-on validation",
    description:
      "Write or review critical implementation paths when that is the fastest way to test the design and reduce risk.",
  },
] as const;

export default function AboutPage() {
  return (
    <Container className="mt-16 sm:mt-28">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <SectionLabel className="tracking-[0.22em]">
          About
        </SectionLabel>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          I move into new platforms, learn the hard constraints, and ship.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          I’m a Principal Architect and hands-on engineering leader focused on
          production AI systems, platforms and distributed systems, developer
          experience, and revenue-critical consumer products.
        </p>
      </header>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
        <div>
          <section aria-labelledby="throughline-heading">
            <h2
              id="throughline-heading"
              className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              The throughline is production engineering.
            </h2>
            <div className="mt-7 space-y-6 text-base leading-7 text-zinc-600 dark:text-zinc-300">
              <p>
                Over more than 25 years, the visible layer of my work has changed
                repeatedly: embedded boards, smartphones, streaming devices,
                consumer web products, cloud platforms, machine-learning
                operations, smart contracts, and AI agents.
              </p>
              <p>
                The job underneath has stayed remarkably consistent. Understand
                the product and business constraint. Find the system boundary
                that matters. Build the right abstraction. Make it observable,
                operable, and legible to the team that inherits it.
              </p>
              <p>
                I work comfortably across frontend, backend, APIs,
                infrastructure, and operations because Principal-level problems
                rarely respect a repository boundary. I care about architecture,
                but I care more about whether it survives contact with users,
                cost, reliability, permissions, and delivery pressure.
              </p>
              <p>
                My AI work is applied systems engineering rather than model
                research: agent orchestration, tool use, identity and access,
                product surfaces, evaluation artifacts, deployment, and the
                runtime around the model.
              </p>
            </div>
          </section>

          <section className="mt-20" aria-labelledby="arc-heading">
            <SectionLabel>Career arc</SectionLabel>
            <h2
              id="arc-heading"
              className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              Several generations of computing, one engineering practice.
            </h2>
            <ol className="mt-10 border-t border-zinc-200 dark:border-zinc-700/60">
              {careerArc.map((item, index) => (
                <li
                  key={item.era}
                  className="grid gap-4 border-b border-zinc-200 py-7 dark:border-zinc-700/60 sm:grid-cols-[3rem_0.75fr_1.25fr]"
                >
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    0{index + 1}
                  </span>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.era}
                  </h3>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-20" aria-labelledby="leadership-heading">
            <SectionLabel>How I lead</SectionLabel>
            <h2
              id="leadership-heading"
              className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white"
            >
              Make the direction clear. Keep the feedback loop honest.
            </h2>
            <p className="mt-5 leading-7 text-zinc-600 dark:text-zinc-300">
              Principal work is organizational leverage expressed through
              technical judgment. I’m most useful when a problem crosses teams
              or layers and the architecture needs to survive implementation,
              operations, and business reality.
            </p>
            <div className="mt-9 grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2">
              {leadershipPractice.map((item, index) => (
                <article
                  key={item.title}
                  className="border-zinc-200 py-6 sm:px-6 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(n+3)]:border-t sm:first:pl-0 dark:border-zinc-700/60"
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
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/~/projects">View selected work</Button>
              <Button variant="secondary" href="/connect">
                Connect
              </Button>
            </div>
          </section>
        </div>

        <aside>
          <div className="lg:sticky lg:top-28">
            <FlickImage
              src={markImage}
              alt="Flick gold hand mark"
              sizes="(min-width: 1024px) 24rem, 20rem"
              className="w-full max-w-sm"
            />

            <section className="mt-10 border-t-2 border-brand-dark pt-7 dark:border-brand-light">
              <SectionLabel>Secondary identity</SectionLabel>
              <h2 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-white">
                Open-source work as 0xFlicker.
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Recent experiments in AI agents, crypto infrastructure,
                distributed systems, and independent products are published
                under that name. flick.ing is the professional home.
              </p>
            </section>

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <SocialLink href="https://github.com/0xflicker" icon={GitHubIcon}>
                GitHub / 0xFlicker
              </SocialLink>
              <SocialLink href="https://x.com/0xflick" icon={XIcon}>
                X / 0xFlick
              </SocialLink>
              <SocialLink href="mailto:me@0xflick.xyz" icon={MailIcon}>
                Email Flick
              </SocialLink>
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
