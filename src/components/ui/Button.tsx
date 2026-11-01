import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-[background-color,color,box-shadow,translate] duration-300 ease-(--ease-honey) disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const VARIANTS: Record<Variant, string> = {
  // Forest fill with gold text reads clearly on the golden page and on the dark cards alike.
  primary:
    "sheen bg-forest-950 text-gold-200 shadow-[0_12px_30px_-12px_rgb(6_19_14/0.7),inset_0_1px_0_rgb(255_255_255/0.08)] hover:bg-forest-800 hover:text-gold-100 hover:shadow-[0_16px_36px_-12px_rgb(6_19_14/0.8),inset_0_1px_0_rgb(255_255_255/0.12)]",
  secondary:
    "border border-forest-950/25 bg-cream-50/80 text-forest-950 backdrop-blur hover:border-forest-950/50 hover:bg-cream-50",
  ghost: "text-forest-950 hover:bg-forest-950/5 hover:text-forest-800",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-6 text-sm",
  lg: "min-h-14 px-8 text-base",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

export function buttonClasses({ variant = "primary", size = "md" }: StyleProps = {}, className?: string): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClasses({ variant, size }, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClasses({ variant, size }, className)} {...props} />;
}
