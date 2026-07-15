import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { SectionLabel } from "@/components/PortfolioUI";
import { createPageMetadata } from "@/lib/site";
import ProjectArchive from "../Home";

export const metadata: Metadata = createPageMetadata({
  title: "0xFlicker / onchain project archive",
  description:
    "Project records for John Dean’s maintained, experimental, and archived 0xFlicker and onchain work.",
  path: "/~/projects/archive",
});

export default function ProjectArchivePage() {
  return (
    <>
      <Container className="mt-16 sm:mt-28">
        <div className="max-w-3xl">
          <SectionLabel>0xFlicker / onchain project archive</SectionLabel>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            A focused archive of the recent onchain chapter.
          </h1>
          <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-300">
            This is not the complete project history. Each entry records the
            role, engineering challenge, status, and technical shape before
            offering source or a still-valid public preview. Older developer
            tools, games, and open-source work are curated on the selected-work
            page and will join this archive only when their records are ready.
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
