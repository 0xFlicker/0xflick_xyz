import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/PortfolioUI";
import { GitHubIcon, LinkedInIcon } from "@/components/SocialIcons";
import markImage from "@/images/avatar.png";
import { createPageMetadata, profileLinks } from "@/lib/site";
import { FlickImage } from "./FlickImage";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "About John Dean, known online as Flick and 0xFlicker: Principal Architect at GIPHY and hands-on systems engineer with 25+ years of production experience.",
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
  [
    "Developer tools + embedded",
    "Metrowerks, Motorola, Freescale, and Nokia: IDEs, SDKs, CI, automated testing, native toolchains, and constrained hardware.",
  ],
  [
    "Television + mobile",
    "Accenture and Time Warner Cable: embedded HTML5 television products, native iOS systems, performance work, releases, and beta support.",
  ],
  [
    "Creative + multiplayer products",
    "Two Shutterstock chapters around browser creative tools, with Sandbox VR in between for games, scheduling, payments, and live operations.",
  ],
  [
    "MLOps + internet-scale media",
    "Product and frontend leadership at Verta, followed by Principal architecture across GIPHY’s consumer, monetization, partner, and platform systems.",
  ],
  [
    "Independent systems",
    "Open-source, onchain infrastructure, and The House: current hands-on work across identity, permissions, agents, multiplayer runtime, and operations.",
  ],
] as const;

const leadershipPractice = [
  [
    "Set direction",
    "Turn an ambiguous goal into boundaries, sequencing, standards, and decisions a team can build against.",
  ],
  [
    "Review the real system",
    "Challenge hidden assumptions in designs and validate critical paths in code when that is the fastest route to truth.",
  ],
  [
    "Own the operating consequences",
    "Treat reliability, migrations, observability, incident learning, delivery, and cost as inputs rather than cleanup.",
  ],
  [
    "Make other engineers faster",
    "Mentor, unblock, and create useful paved roads without becoming a human approval queue.",
  ],
] as const;

export default function AboutPage() {
  return (
    <Container className="mt-16 sm:mt-28">
      <header className="max-w-4xl border-b border-zinc-200 pb-14 dark:border-zinc-700/60 sm:pb-20">
        <SectionLabel className="tracking-[0.22em]">About</SectionLabel>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
          I’m John Dean, known online as Flick.
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          I’m a Principal Architect at GIPHY and a hands-on systems engineer. I
          turn emerging platforms into production systems that teams can ship,
          operate, and improve.
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
                I began in developer tools at Metrowerks and continued through
                Motorola, Freescale, Nokia, Accenture, and Time Warner Cable—often
                through acquisitions, spin-offs, technology transfers, or client
                relationships rather than conventional job changes.
              </p>
              <p>
                I later spent two substantial chapters at Shutterstock. Between
                them, I left deliberately to work in games at Sandbox VR and
                enterprise MLOps at Verta. I returned after the PicMonkey
                acquisition, helped deliver Shutterstock Create and
                Shutterstock’s first AI image-editing tool, and moved to GIPHY
                as a Principal Architect in 2024.
              </p>
              <p>
                Principal-level problems rarely respect a repository boundary.
                I work across product, frontend, backend, APIs, infrastructure,
                and operations, and I stay close enough to critical code paths
                to test whether the design is honest.
              </p>
              <p>
                My AI work is applied systems engineering, not model research:
                agent orchestration, tool use, identity and access, durable
                state, product surfaces, evaluation artifacts, deployment, and
                the runtime around the model.
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
              {careerArc.map(([era, description], index) => (
                <li
                  key={era}
                  className="grid gap-4 border-b border-zinc-200 py-7 dark:border-zinc-700/60 sm:grid-cols-[3rem_0.75fr_1.25fr]"
                >
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    0{index + 1}
                  </span>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {era}
                  </h3>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {description}
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
            <div className="mt-9 grid border-y border-zinc-200 dark:border-zinc-700/60 sm:grid-cols-2">
              {leadershipPractice.map(([title, description], index) => (
                <article
                  key={title}
                  className="border-zinc-200 py-6 sm:[&:nth-child(odd)]:pr-6 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-6 sm:[&:nth-child(n+3)]:border-t dark:border-zinc-700/60"
                >
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {description}
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
              <SectionLabel>One engineer, two GitHub chapters</SectionLabel>
              <h2 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-white">
                CaptEmulation → 0xFlicker
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                CaptEmulation is my original professional and open-source
                account. Since 2021, most independent AI, onchain, and product
                work has been published as 0xFlicker. The accounts represent
                different periods and audiences; the engineering work belongs
                to the same person.
              </p>
            </section>

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <SocialLink href={profileLinks.github} icon={GitHubIcon}>
                0xFlicker on GitHub
              </SocialLink>
              <SocialLink href={profileLinks.originalGithub} icon={GitHubIcon}>
                CaptEmulation on GitHub
              </SocialLink>
              <SocialLink href={profileLinks.linkedIn} icon={LinkedInIcon}>
                John Dean on LinkedIn
              </SocialLink>
              <SocialLink href={profileLinks.email} icon={MailIcon}>
                Email John
              </SocialLink>
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
