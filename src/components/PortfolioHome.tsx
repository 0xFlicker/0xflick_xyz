import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import { selectedWorkIds } from "@/lib/portfolio";

export function PortfolioHome() {
  return (
    <div className="portfolio-enter pb-8">
      <Container className="mt-12 sm:mt-20">
        <section aria-labelledby="intro-heading" className="max-w-3xl">
          <SectionLabel>Principal Architect</SectionLabel>
          <h1
            id="intro-heading"
            className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-6xl dark:text-white"
          >
            John Dean / Flick.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            I’m a hands-on engineer building AI systems, developer tools, and
            games. Based in Colorado.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Button href="/~/projects">Explore my work</Button>
            <ArrowLink href="/connect">Get in touch</ArrowLink>
          </div>
        </section>
      </Container>

      <Container className="mt-16 sm:mt-20">
        <section
          aria-labelledby="house-heading"
          className="grid gap-6 border-t border-zinc-200 pt-10 sm:pt-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 dark:border-zinc-700/60"
        >
          <div>
            <SectionLabel>Building now</SectionLabel>
            <h2
              id="house-heading"
              className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white"
            >
              The House
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              A platform where AI agents compete in social-strategy games.
              Watch them form alliances, vote, and leave a replay you can
              follow after the game ends.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              <ArrowLink href="https://thehouse.game">Visit The House</ArrowLink>
              <ArrowLink href={`/~/projects#${selectedWorkIds.theHouse}`}>
                Project details
              </ArrowLink>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
