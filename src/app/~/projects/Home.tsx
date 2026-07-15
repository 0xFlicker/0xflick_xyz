import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/Container";

const archiveProjects = [
  {
    title: "$FAME Society",
    period: "Public by 2024 · Maintained in 2026",
    status: "Maintained",
    role: "Protocol and product engineer",
    challenge:
      "Connect liquid token behavior, NFT ownership, and an existing community without making the product impossible to explain or operate.",
    summary:
      "DN404-based ownership and liquidity systems for Fame Lady Society, supported by contract, website, and auction work.",
    image: "/fame.png",
    imageAlt: "$FAME Society preview",
    live: "https://fameladysociety.com/fame",
    source: "https://github.com/fame-lady-society/fame-contracts",
  },
  {
    title: "Fame Lady Society",
    period: "Public by 2024 · Maintained in 2026",
    status: "Maintained",
    role: "Smart contract and product engineer",
    challenge:
      "Move a long-running NFT community onto creator-controlled contracts and modern product surfaces without erasing its history.",
    summary:
      "Contract wrapping, collection infrastructure, website, and community product work for Fame Lady Society.",
    image: "/fls-wrap.gif",
    imageAlt: "Fame Lady Society wrapper preview",
    live: "https://fameladysociety.com",
    source: "https://github.com/fame-lady-society/fame-contracts",
  },
  {
    title: "Make it a quote",
    period: "Public by 2024",
    status: "Experimental",
    role: "Product engineer",
    challenge:
      "Turn a small social interaction into a shareable Farcaster-native product with a very short path from input to artifact.",
    summary:
      "An experiment in social-product distribution, image generation, and Farcaster Frames.",
    image: "/makeitaquote.png",
    imageAlt: "Make it a quote preview",
    live: "https://quote.flick.ing",
    source: undefined,
  },
  {
    title: "Bitflick",
    period: "Public by 2024",
    status: "Experimental",
    role: "Creator and full-stack engineer",
    challenge:
      "Make recursive ordinal inscriptions approachable while keeping inscription composition and ownership visible to the user.",
    summary:
      "A product and tooling experiment for lazy minting recursive Bitcoin ordinals.",
    image: "/206.png",
    imageAlt: "Bitflick ordinal preview",
    live: "https://www.bitflick.xyz",
    source: "https://github.com/flick-ing/inscriptions",
  },
  {
    title: "Nameflick",
    period: "Public by 2024",
    status: "Experimental",
    role: "Creator and full-stack engineer",
    challenge:
      "Build a useful identity layer around blockchain names without asking the name itself to carry an entire professional identity.",
    summary:
      "An ENS-era identity and utility experiment preserved as part of the Web3 chapter of the archive.",
    image: "/flick.png",
    imageAlt: "Flick gold hand mark",
    live: "https://nameflick.com",
    source: undefined,
  },
  {
    title: "On Chain Gas",
    period: "Public by 2024",
    status: "Archived",
    role: "Creator and smart contract engineer",
    challenge:
      "Render a changing network signal from code and data stored entirely on-chain, with no conventional application backend.",
    summary:
      "An on-chain JavaScript and generative-output experiment built around Ethereum gas conditions.",
    image: "/preview.gif",
    imageAlt: "On Chain Gas preview",
    live: "https://0xflick.xyz/gas",
    source: "https://github.com/0xFlicker/onchaingas",
  },
  {
    title: "On Chain Check Gas",
    period: "Public by 2024",
    status: "Archived",
    role: "Creator and smart contract engineer",
    challenge:
      "Extend an existing on-chain artwork while preserving holder context and the constraints of code executed from public chain state.",
    summary:
      "A derivative on-chain gas experiment and claim surface, retained as a technical record rather than a current product.",
    image: "/check_preview.gif",
    imageAlt: "On Chain Check Gas preview",
    live: "https://0xflick.xyz/check",
    source: undefined,
  },
] as const;

export default function ProjectArchive() {
  return (
    <Container className="mt-14 sm:mt-20">
      <div className="space-y-10">
        {archiveProjects.map((project, index) => (
          <article
            key={project.title}
            className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white/50 dark:border-zinc-700/60 dark:bg-zinc-900/40 lg:grid-cols-[0.72fr_1.28fr]"
          >
            <div className="relative min-h-64 bg-zinc-950 lg:min-h-full">
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(min-width: 1024px) 35vw, 100vw"
                className="object-contain p-6"
                unoptimized={project.image.endsWith(".gif")}
              />
            </div>
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                  0{index + 1}
                </span>
                <span className="rounded-full border border-zinc-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
                  {project.status}
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {project.title}
              </h2>
              <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Date range
                  </dt>
                  <dd className="mt-1 leading-6 text-zinc-600 dark:text-zinc-400">
                    {project.period}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Role
                  </dt>
                  <dd className="mt-1 leading-6 text-zinc-600 dark:text-zinc-400">
                    {project.role}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Engineering challenge
                  </dt>
                  <dd className="mt-1 leading-6 text-zinc-600 dark:text-zinc-400">
                    {project.challenge}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Technical record
                  </dt>
                  <dd className="mt-1 leading-6 text-zinc-600 dark:text-zinc-400">
                    {project.summary}
                  </dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
                {project.source && (
                  <Link
                    href={project.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dark dark:text-zinc-200 dark:decoration-zinc-600 dark:hover:text-brand-light dark:focus-visible:outline-brand-light"
                  >
                    Source
                  </Link>
                )}
                <Link
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dark dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-brand-light dark:focus-visible:outline-brand-light"
                >
                  Public preview
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}
