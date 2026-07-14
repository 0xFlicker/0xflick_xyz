import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/PortfolioUI";
import ProjectArchive from "../Home";

export const metadata: Metadata = {
  title: "Project archive",
  description:
    "The preserved archive of experiments and independent projects published by Flick.",
};

export default function ProjectArchivePage() {
  return (
    <>
      <Container className="mt-16 sm:mt-28">
        <div className="max-w-3xl">
          <SectionLabel>Preserved project archive</SectionLabel>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            Experiments, tools, and on-chain work.
          </h1>
          <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-300">
            This is the original project collection, kept intact while the main
            work page moves toward a smaller set of deeper system stories.
          </p>
          <Link
            href="/~/projects"
            className="mt-6 inline-block text-sm font-semibold text-zinc-800 underline decoration-zinc-300 underline-offset-4 transition hover:text-brand-dark dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:text-brand-light"
          >
            Return to selected work
          </Link>
        </div>
      </Container>
      <ProjectArchive />
    </>
  );
}
