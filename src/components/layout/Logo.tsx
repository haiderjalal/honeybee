import { hexPointsAttr } from "@/utils/hex";
import { cn } from "@/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe6a6" />
          <stop offset="100%" stopColor="#e09a12" />
        </linearGradient>
      </defs>
      <polygon points={hexPointsAttr(20, 20, 18)} fill="url(#logo-gold)" />
      <polygon points={hexPointsAttr(20, 20, 13)} fill="none" stroke="#3b2507" strokeOpacity="0.35" strokeWidth="1.5" />
      <ellipse cx="20" cy="22" rx="7" ry="5" fill="#24160a" />
      <path d="M15.5 18.6v6.8M19 17.4v9.2M22.5 17.7v8.6" stroke="#f6bd3c" strokeWidth="1.6" />
      <ellipse cx="17" cy="14.5" rx="3" ry="4.5" fill="#fff8e6" opacity="0.85" />
      <ellipse cx="23" cy="14.5" rx="3" ry="4.5" fill="#fff8e6" opacity="0.85" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-2xl font-medium tracking-tight text-cream-50">Honeybee</span>
    </span>
  );
}
