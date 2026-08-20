import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageContentProps {
  text: string;
}

function safeHref(href: string | undefined): string | null {
  if (!href) return null;
  if (href.startsWith("/") || href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? href : null;
  } catch {
    return null;
  }
}

function SafeLink({
  children,
  href,
  ...props
}: ComponentPropsWithoutRef<"a">): ReactNode {
  const safe = safeHref(href);
  if (!safe) return <span>{children}</span>;
  const external = safe.startsWith("http://") || safe.startsWith("https://");
  return (
    <a
      {...props}
      className="font-medium text-cyan-700 underline decoration-cyan-400/50 underline-offset-4 hover:text-cyan-600 dark:text-cyan-300"
      href={safe}
      rel={external ? "noopener noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

export function MessageContent({ text }: MessageContentProps) {
  return (
    <div className="assistant-markdown min-w-0 break-words text-[0.95rem] leading-7 text-zinc-800 dark:text-zinc-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => safeHref(url) ?? ""}
        components={{
          a: SafeLink,
          img: () => null,
          pre: ({ children }) => (
            <div
              aria-label="Scrollable code block"
              className="my-4 max-w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-950 p-4 text-sm text-zinc-100 dark:border-white/10"
              tabIndex={0}
            >
              <pre>{children}</pre>
            </div>
          ),
          table: ({ children }) => (
            <div
              aria-label="Scrollable table"
              className="my-4 max-w-full overflow-x-auto"
              tabIndex={0}
            >
              <table className="min-w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
