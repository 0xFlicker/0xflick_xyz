import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/PortfolioUI";
import { createPageMetadata } from "@/lib/site";
import ProjectArchive from "../Home";

export const metadata: Metadata = createPageMetadata({
  title: "Project archive",
  description:
    "Internal project records for Flick's maintained, experimental, and archived independent work.",
  path: "/~/projects/archive",
});

export default function ProjectArchivePage() {
  return (
    <>
      <Container className="mt-16 sm:mt-28">
        <div className="max-w-3xl">
          <SectionLabel>Project archive</SectionLabel>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            Technical records, not a link graveyard.
          </h1>
          <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-300">
            Each entry documents the role, engineering challenge, status, and
            technical shape before offering a source or public preview. Links
            were checked in July 2026; a responding URL does not imply an
            archived experiment is still maintained.
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
