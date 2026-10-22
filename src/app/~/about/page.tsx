import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ArrowLink, SectionLabel } from "@/components/PortfolioUI";
import markImage from "@/images/avatar.png";
import { createPageMetadata, profileLinks } from "@/lib/site";
import { FlickImage } from "./FlickImage";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "John Dean, known online as Flick: Principal Architect at GIPHY, creator of The House, and engineer with 25+ years across developer tools, creative software, and games.",
  path: "/~/about",
});

export default function AboutPage() {
  return (
    <Container className="mt-12 sm:mt-20">
      <header className="max-w-3xl">
        <SectionLabel>About</SectionLabel>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-zinc-900 sm:text-5xl dark:text-white">
          I’m John Dean. Online, I’m Flick.
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Principal Architect at GIPHY, based in Colorado. I’ve spent 25+ years
          building software, starting with developer tools and embedded systems.
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
        <div>
          <div className="space-y-6 text-base leading-7 text-zinc-600 dark:text-zinc-300">
            <p>
              I began at Metrowerks working on CodeWarrior and embedded
              development boards, then worked on smartphone tools at Nokia and
              television and mobile software at Accenture and Time Warner Cable.
              Some of those moves involved acquisitions and spin-offs rather
              than changing desks.
            </p>
            <p>
              At Shutterstock, I helped build the browser-based Editor and led
              its partner SDK and cloud migration. I left to work on multiplayer
              games at Sandbox VR, then joined Verta as employee #6, taking
              ownership of everything that touched the browser.
            </p>
            <p>
              I returned to Shutterstock after the PicMonkey acquisition,
              helped deliver Create, and contributed to the team behind its
              first AI image-editing tool. In 2024, I moved to GIPHY as Principal
              Architect, where I lead architecture and implementation for
              advertising systems.
            </p>
            <p>
              Independently, I build The House, where AI agents compete in
              social-strategy games. I also work on Morpheus, a graphical
              adventure game, and publish open-source tools.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            <ArrowLink href="/~/projects">Explore the work</ArrowLink>
            <ArrowLink href="/~/cv">Full experience</ArrowLink>
          </div>
        </div>

        <aside>
          <FlickImage src={markImage} alt="Flick gold hand mark" sizes="(min-width: 1024px) 24rem, 20rem" className="w-full max-w-sm" />
          <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700/60">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Find me online</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              I publish as 0xFlicker. Earlier work lives under CaptEmulation.
            </p>
            <ul className="mt-5 space-y-4">
              <li><ArrowLink href={profileLinks.github}>0xFlicker on GitHub</ArrowLink></li>
              <li><ArrowLink href={profileLinks.originalGithub}>CaptEmulation on GitHub</ArrowLink></li>
              <li><ArrowLink href={profileLinks.linkedIn}>LinkedIn</ArrowLink></li>
              <li><ArrowLink href={profileLinks.email}>Email me</ArrowLink></li>
            </ul>
          </section>
        </aside>
      </div>
    </Container>
  );
}
