"use client";

import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverButton,
  PopoverBackdrop,
  PopoverPanel,
} from "@headlessui/react";
import clsx from "clsx";

import { Container } from "@/components/Container";
import avatarImage from "@/images/avatar.png";
import { navigationItems } from "@/lib/navigation";
import { siteName } from "@/lib/site";

function CloseIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m17.25 6.75-10.5 10.5m0-10.5 10.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative z-50 flex-none">
      <Container>
        <div className="flex items-center justify-between gap-6 border-b border-zinc-200 py-6 dark:border-zinc-700/60">
          <Link href="/" aria-label={`${siteName} home`} className="flex min-w-0 items-center gap-3 rounded-sm text-sm font-semibold text-zinc-900 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:text-zinc-100 dark:focus-visible:outline-brand-light">
            <Image src={avatarImage} alt="" sizes="2.25rem" className="h-9 w-9 flex-none rounded-full" priority />
            <span>{siteName}</span>
          </Link>
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex gap-7 text-sm">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined} className={clsx(
                    "block py-2 underline-offset-8 outline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:focus-visible:outline-brand-light",
                    isCurrent(item.href)
                      ? "font-semibold text-brand-dark underline dark:text-brand-light"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                  )}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Popover className="md:hidden">
            <PopoverButton className="rounded-sm px-2 py-2 text-sm font-medium text-zinc-800 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:text-zinc-100 dark:focus-visible:outline-brand-light">
              Menu
            </PopoverButton>
            <PopoverBackdrop className="fixed inset-0 z-50 bg-zinc-900/40 dark:bg-black/70" />
            <PopoverPanel focus className="fixed inset-x-4 top-4 z-50 rounded-lg bg-white p-6 shadow-lg ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-white/15">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{siteName}</span>
                <PopoverButton aria-label="Close menu" className="rounded-sm p-2 text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:text-zinc-300 dark:focus-visible:outline-brand-light">
                  <CloseIcon className="h-6 w-6" />
                </PopoverButton>
              </div>
              <nav aria-label="Primary" className="mt-4">
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {navigationItems.map((item) => (
                    <li key={item.href}>
                      <PopoverButton as={Link} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined} className={clsx(
                        "block rounded-sm py-3 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:focus-visible:outline-brand-light",
                        isCurrent(item.href)
                          ? "font-semibold text-brand-dark underline dark:text-brand-light"
                          : "text-zinc-700 dark:text-zinc-200"
                      )}>
                        {item.label}
                      </PopoverButton>
                    </li>
                  ))}
                </ul>
              </nav>
            </PopoverPanel>
          </Popover>
        </div>
      </Container>
    </header>
  );
}
