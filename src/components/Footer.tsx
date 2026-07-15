import Link from "next/link";

import { ContainerInner, ContainerOuter } from "@/components/Container";
import { navigationItems } from "@/lib/navigation";
import { profileLinks, siteName } from "@/lib/site";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="transition hover:text-brand-dark dark:hover:text-brand-light-400"
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const footerLinks = [
    ...navigationItems,
    { href: profileLinks.github, label: "0xFlicker GitHub" },
    { href: profileLinks.originalGithub, label: "CaptEmulation GitHub" },
  ] as const;

  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="border-t border-zinc-100 pb-16 pt-10 dark:border-zinc-700/40">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {footerLinks.map((item) => (
                  <NavLink key={item.href} href={item.href}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                &copy; {new Date().getFullYear()} {siteName}
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  );
}
