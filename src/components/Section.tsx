import { useId } from "react";

interface SectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  let id = useId();

  return (
    <section
      aria-labelledby={id}
      className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40"
    >
      <div className="max-w-3xl grid items-baseline gap-y-8 md:grid-cols-1">
        {typeof title === "string" ? (
          <h2
            id={id}
            className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
          >
            {title}
          </h2>
        ) : (
          title
        )}
        <div className="md:col-span-3">{children}</div>
      </div>
    </section>
  );
}
