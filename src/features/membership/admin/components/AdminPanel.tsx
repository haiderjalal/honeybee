import type { JSX, ReactNode } from "react";

interface AdminPanelProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** One titled section of the admin page. The id doubles as the anchor used by the section navigation. */
export function AdminPanel({ id, eyebrow, title, description, children }: AdminPanelProps): JSX.Element {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 rounded-3xl border border-cream-50/10 bg-forest-900/60 p-6 sm:p-8"
    >
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">{eyebrow}</p>
        <h2 id={`${id}-title`} className="font-display text-3xl text-cream-50">
          {title}
        </h2>
        {description ? <p className="text-cream-300">{description}</p> : null}
      </header>
      <div className="mt-6 flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }): JSX.Element {
  return <h3 className="font-display text-xl text-cream-50">{children}</h3>;
}
