import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

import { Container } from "@/components/Container";
import {
  GitHubIcon,
  FarcasterIcon,
  LinkedInIcon,
  XIcon,
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
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500" />
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
          <h1 className="hidden lg:block text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100 border border-gray-300 rounded-lg p-4">
            Flick builds the future of the web
          </h1>
          <h1 className="block lg:hidden text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100 border border-gray-300 rounded-lg p-4">
            Flick builds the future
          </h1>
          <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400  mb-16 border border-gray-300 rounded-lg p-4">
            <p>
              Flick started programming at age 8 on an Apple IIe and never
              stopped. By highschool, they were building custom BBS (bulletin
              Board Systems), writing neural networks, self-publishing games and
              apps, joining the demo scene and winning awards for their work.
            </p>
            <p>
              Since Flick already knew how to program leaving highschool, they
              decided to study computer engineering to learn how computers
              worked. While receiving a Bachelor of Science in Computer
              Engineering, joining IEEE leadership, the robotics team building
              autonomous fire-fighting robots, and learning how electricity,
              transistors, and silicon manufacturing worked.
            </p>
            <p>
              Professionally Flick has built and maintained automated testing
              tools, published SDKs and library, developer tools, embedded
              systems, native mobile games and applications, consumer multimedia
              websites, online image editing, leaderboards, machine learning
              tagging, training, deployment and usage, backend services, seo,
              analytics, visualization, security, crypto, cloud, serverless, and
              more.
            </p>
            <p>
              Flick has been active in crypto since the early days of Bitcoin
              ASIC mining, having run a mining operation and a f2pool mining
              pool for many years. Flick has also built open source libraries
              and tools for profit switching mining, mining pool visualization,
              utxo transaction management and logging, nfts, ordinals, tokens,
              dapps, integrations, flashloans, sniping, and more.
            </p>
            <p>Today, Flick is looking to build the future of the web,</p>
          </div>
        </div>
        <div className="lg:pl-20">
          <ul role="list" className="border border-gray-300 rounded-lg p-4" >
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
              href="https://github.com/0xflicker"
              icon={GitHubIcon}
              className="mt-4"
            >
              Follow on GitHub
            </SocialLink>
            <SocialLink
              href="mailto:me@0xflick.xyz"
              icon={MailIcon}
              className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
            >
              me@0xflick.xyz
            </SocialLink>
          </ul>
        </div>
      </div>
    </Container>
  );
}
