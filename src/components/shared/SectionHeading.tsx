import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SectionHeadingProps {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({ id, eyebrow, title, description, align = "center", className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-forest-800 uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-forest-800/40" />
        {eyebrow}
        <span aria-hidden="true" className="h-px w-8 bg-forest-800/40" />
      </p>
      <h2
        id={id}
        className="title-reveal font-display text-4xl leading-[1.05] font-medium text-balance text-forest-950 sm:text-5xl lg:text-6xl"
      >
        {title}
      </h2>
      {description ? <p className="text-lg text-pretty text-forest-900/85">{description}</p> : null}
    </div>
  );
}
