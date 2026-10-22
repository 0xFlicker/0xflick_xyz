import Link from "next/link";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import { selectedWork, selectedWorkIds } from "@/lib/portfolio";

export function PortfolioHome() {
  return (
    <div className="portfolio-enter pb-8">
      <Container className="mt-12 sm:mt-20">
        <section aria-labelledby="intro-heading" className="max-w-3xl">
          <SectionLabel>John Dean / Flick</SectionLabel>
          <h1 id="intro-heading" className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white">
            Principal Architect at GIPHY.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            I build advertising systems at GIPHY and run The House, a platform
            where AI agents compete in social-strategy games.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button href="/~/projects">Explore my work</Button>
            <ArrowLink href="/connect">Get in touch</ArrowLink>
          </div>
        </section>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <section aria-labelledby="house-heading" className="grid gap-6 border-y border-zinc-200 py-10 sm:py-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 dark:border-zinc-700/60">
          <div>
            <SectionLabel>Building now</SectionLabel>
            <h2 id="house-heading" className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
              The House
            </h2>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Independent project
            </p>
          </div>
          <div>
            <p className="text-xl leading-8 text-zinc-700 dark:text-zinc-200">
              AI agents with identities, private strategies, and a public record
              of what they actually did.
            </p>
            <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Influence is the first game. I build and operate the platform,
              from agent permissions and multiplayer orchestration to the
              replays that let you follow a game after it ends.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              <ArrowLink href="https://thehouse.game">Visit The House</ArrowLink>
              <ArrowLink href={`/~/projects#${selectedWorkIds.theHouse}`}>
                How it works
              </ArrowLink>
            </div>
          </div>
        </section>
      </Container>

      <Container className="mt-16 sm:mt-20">
        <section aria-labelledby="work-heading">
          <div className="flex items-baseline justify-between gap-6">
            <h2 id="work-heading" className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Selected work
            </h2>
            <ArrowLink href="/~/projects">All work</ArrowLink>
          </div>
          <div className="mt-8">
            {selectedWork.map((work) => (
              <article key={work.id} className="grid gap-4 border-t border-zinc-200 py-8 sm:grid-cols-[0.7fr_1.3fr] sm:gap-12 lg:gap-16 dark:border-zinc-700/60">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                    <Link href={`/~/projects#${work.id}`} className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dark dark:focus-visible:outline-brand-light">
                      {work.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    {work.eyebrow}
                  </p>
                </div>
                <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300">
                  {work.summary}
                </p>
              </article>
            ))}
          </div>
          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700/60">
            <ArrowLink href="/~/projects">Games, open source, and more work</ArrowLink>
          </div>
        </section>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <section aria-labelledby="contact-heading" className="border-t border-zinc-200 pt-10 dark:border-zinc-700/60">
          <h2 id="contact-heading" className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Let’s talk.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Based in Colorado. Exploring remote Principal and Staff+ roles
            working on AI systems, developer platforms, and distributed systems.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ArrowLink href="/connect">Get in touch</ArrowLink>
            <ArrowLink href="/intro">Original WebGL intro</ArrowLink>
          </div>
        </section>
      </Container>
    </div>
  );
}
