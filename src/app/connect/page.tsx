import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import { createPageMetadata, profileLinks } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Connect",
  description:
    "Get in touch with John Dean / Flick about remote Principal and Staff+ roles in AI systems, developer platforms, and distributed systems.",
  path: "/connect",
});

export default function ConnectPage() {
  return (
    <Container className="mt-12 sm:mt-20">
      <div className="max-w-2xl">
        <SectionLabel>Connect</SectionLabel>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-5xl dark:text-white">
          Let’s talk.
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          I’m exploring remote Principal and Staff+ engineering roles in AI
          systems, developer platforms, and distributed systems. I’m based in
          Colorado, on Mountain Time.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href={profileLinks.email}>Email me</Button>
          <Button variant="secondary" href="https://calendly.com/me-0xflick/30min" target="_blank" rel="noopener noreferrer">
            Book a 30-minute call
          </Button>
        </div>
        <p className="mt-5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          A short note about the team and what you’re building is a good place to start.
        </p>

        <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-700/60">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            What I’m looking for
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
            A role where I can set technical direction, write code, and work
            with the people running it. I’m also open to selected advisory
            work on architecture, agent systems, migrations, and reliability.
          </p>
          <div className="mt-6">
            <ArrowLink href="/~/projects">See my work</ArrowLink>
          </div>
        </section>
      </div>
    </Container>
  );
}
