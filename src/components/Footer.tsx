import Link from "next/link";
import type { ReactNode } from "react";

import { ContainerInner, ContainerOuter } from "@/components/Container";
import { navigationItems } from "@/lib/navigation";
import { profileLinks, siteName } from "@/lib/site";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="rounded-sm underline-offset-4 outline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:focus-visible:outline-brand-light"
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const footerLinks = [
    ...navigationItems,
    { href: "/assistant", label: "Local AI assistant" },
    { href: profileLinks.github, label: "0xFlicker GitHub" },
    { href: profileLinks.originalGithub, label: "CaptEmulation GitHub" },
  ] as const;

  return (
    <footer className="mt-20 flex-none">
      <ContainerOuter>
        <div className="border-t border-zinc-100 pb-16 pt-10 dark:border-zinc-700/40">
          <ContainerInner>
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row">
              <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                {footerLinks.map((item) => (
                  <NavLink key={item.href} href={item.href}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <p className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                &copy; {new Date().getFullYear()} {siteName}
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  );
}
