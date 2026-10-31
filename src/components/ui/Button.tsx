import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-[background-color,color,box-shadow,translate] duration-300 ease-(--ease-honey) disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const VARIANTS: Record<Variant, string> = {
  primary:
    "sheen bg-linear-to-b from-gold-300 to-gold-500 text-forest-950 shadow-[0_10px_30px_-10px_rgb(224_154_18/0.8),inset_0_1px_0_rgb(255_255_255/0.5)] hover:from-gold-200 hover:to-gold-400 hover:shadow-[0_14px_40px_-10px_rgb(246_189_60/0.9),inset_0_1px_0_rgb(255_255_255/0.6)]",
  secondary:
    "border border-gold-400/40 bg-forest-800/60 text-cream-50 backdrop-blur hover:border-gold-300 hover:bg-forest-700/70",
  ghost: "text-cream-100 hover:bg-cream-50/5 hover:text-gold-300",
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
