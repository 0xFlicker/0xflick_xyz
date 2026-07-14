import Link from "next/link";
import clsx from "clsx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

function ArrowIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 8h9.5m-3.75-3.75L12.5 8l-3.75 3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function ArrowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 outline-offset-4 transition hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark dark:text-zinc-100 dark:hover:text-brand-light dark:focus-visible:outline-brand-light"
    >
      {children}
      <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark dark:text-brand-light",
        className
      )}
    >
      {children}
    </p>
  );
}
