import { useId } from "react";

import { cn } from "@/utils/cn";

interface BeeProps {
  className?: string;
}

/** Decorative bee, facing right. Wings flap via the `.bee-wing` CSS animation. */
export function Bee({ className }: BeeProps) {
  const id = useId();
  const bodyId = `${id}-body`;
  const wingId = `${id}-wing`;

  return (
    <svg viewBox="0 0 64 48" className={cn("overflow-visible", className)} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={bodyId} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="60%" stopColor="#f2b21c" />
          <stop offset="100%" stopColor="#b9740a" />
        </radialGradient>
        <linearGradient id={wingId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#dff1ff" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <ellipse
        className="bee-wing"
        cx="26"
        cy="13"
        rx="9"
        ry="13"
        fill={`url(#${wingId})`}
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="0.8"
      />
      <ellipse
        className="bee-wing"
        cx="35"
        cy="14"
        rx="7"
        ry="11"
        fill={`url(#${wingId})`}
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="0.8"
        style={{ animationDelay: "-45ms" }}
      />

      <path d="M8 30 L2 31.5 L8 33 Z" fill="#2a1a08" />
      <ellipse cx="28" cy="31" rx="20" ry="13" fill={`url(#${bodyId})`} />
      <path d="M20 19.5 C17 25 17 37 20 42.5 L25.5 43.8 C22.5 37 22.5 25 25.5 18.2 Z" fill="#24160a" />
      <path d="M31 18 C28 25 28 37 31 44 L36 43.4 C33.5 37 33.5 25 36 18.6 Z" fill="#24160a" />
      <circle cx="48" cy="29" r="9" fill="#24160a" />
      <circle cx="51.5" cy="26.5" r="2.6" fill="#ffffff" />
      <circle cx="52.2" cy="26.2" r="1.3" fill="#120a03" />
      <path d="M50 21 C51 15 54 12 57 11" fill="none" stroke="#24160a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M46 21 C46 15 47 11 49.5 9" fill="none" stroke="#24160a" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="24" cy="25" rx="9" ry="3" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}
