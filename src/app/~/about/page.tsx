import { type Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";

import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import {
  GitHubIcon,
  FarcasterIcon,
  XIcon,
  TelegramIcon,
} from "@/components/SocialIcons";
import portraitImage from "@/images/nfts/flick-cp.png";
import { FlickImage } from "./FlickImage";

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className={clsx(className, "flex")}>
      <Link
        href={href}
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-brand-dark dark:text-zinc-200 dark:hover:text-brand-light-400"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-brand-dark dark:group-hover:fill-brand-light-400" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  );
}

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

export const metadata: Metadata = {
  title: "About",
  description: "Flick builds the future of the web.",
};

export default function About() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
        <div className="lg:pl-20">
          <div className="max-w-xs px-2.5 lg:max-w-none">
            <FlickImage
              src={portraitImage}
              alt=""
              sizes="(min-width: 1024px) 32rem, 20rem"
              className="aspect-square rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
            />
          </div>
        </div>
        <div className="lg:order-first lg:row-span-2">
          <div className="border border-brand-dark dark:border-brand-light rounded-lg p-4">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
              Principal Architect &amp; Engineering Leader — AI systems,
              platforms, and revenue-critical infrastructure
            </h1>
            <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
              I build and scale high-leverage software systems: developer
              platforms, performance &amp; reliability programs, and product
              infrastructure that ties directly to business outcomes. Lately:
              applied AI integrations, automation, and tooling that helps teams
              ship faster with higher quality.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button
                href="https://calendly.com/me-0xflick/30min"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a 30-minute chat
              </Button>
              <Button variant="secondary" href="/~/projects">
                See my work
              </Button>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Open to Staff+ / Principal / Head of Engineering / CTO-track roles
              (see{" "}
              <Link
                href="/connect"
                className="font-medium text-zinc-700 transition hover:text-brand-dark dark:text-zinc-200 dark:hover:text-brand-light-400"
              >
                Connect
              </Link>{" "}
              for details).
            </p>
            <p className="mt-4 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Next.js • TypeScript • Platform/DevEx • Observability •
              Ads/monetization systems
            </p>
          </div>
          <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400 mb-16 border border-brand-dark dark:border-brand-light rounded-lg p-4">
            <p>
              I am a principal architect and engineering leader focused on
              platforms, product systems, and revenue-critical infrastructure.
              I build the systems that turn strategy into shipped outcomes and
              make teams faster without sacrificing reliability. My current
              focus is applied AI that delivers measurable gains in real
              products.
            </p>
            <p>
              I have been building systems end-to-end since the early days,
              from low-level computing to modern product infrastructure. That
              throughline shows up in how I approach architecture: start with
              the business goal, then design for durability and scale.
            </p>
            <p>
              I have owned cross-functional work across product, infra, dev
              velocity, and reliability. My experience spans startups, growth
              teams, and large platforms where the systems I shipped were
              directly tied to revenue, retention, and trust.
            </p>
            <p>
              On AI, I focus on execution over research: practical integrations,
              automation, and internal tooling that help teams ship better
              software. Think applied AI for real workflows, not demos.
            </p>
            <p>
              I have deep crypto and cryptography experience rooted in security,
              distributed systems, and open source. That work sharpened how I
              think about trust, adversarial environments, and large-scale
              production systems.
            </p>
            <p>
              Next, I want to partner with teams building platform leverage and
              AI-enabled products where execution matters: faster delivery,
              stronger reliability, and clear business impact.
            </p>
          </div>
        </div>
        <div className="lg:pl-20">
          <ul
            role="list"
            className="border border-brand-dark dark:border-brand-light rounded-lg p-4"
          >
            <SocialLink href="https://x.com/0xflick" icon={XIcon}>
              Follow on X
            </SocialLink>
            <SocialLink
              href="https://warpcast.com/flick"
              icon={FarcasterIcon}
              className="mt-4"
            >
              Follow on Farcaster
            </SocialLink>
            <SocialLink
              href="https://t.me/flick_the_dev"
              icon={TelegramIcon}
              className="mt-4"
            >
              Connect on Telegram
            </SocialLink>
            <SocialLink
              href="https://github.com/0xflicker"
              icon={GitHubIcon}
              className="mt-4"
            >
              Follow on GitHub
            </SocialLink>
            <SocialLink
              href="mailto:me@0xflick.xyz"
              icon={MailIcon}
              className="mt-8 border-t border-brand-light pt-8 dark:brand-dark"
            >
              me@0xflick.xyz
            </SocialLink>
          </ul>
        </div>
      </div>
    </Container>
  );
}
