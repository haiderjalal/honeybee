"use client";

import { useEffect, useRef } from "react";

/**
 * A soft light that follows the pointer across the hero section.
 * Writes CSS variables on a single element and throttles to one update per frame.
 * Disabled for touch screens and reduced-motion users (the element simply stays hidden).
 */
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spot = ref.current;
    const section = spot?.parentElement;
    if (!spot || !section) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      spot.style.setProperty("--sx", `${x}px`);
      spot.style.setProperty("--sy", `${y}px`);
    };
    const onMove = (event: PointerEvent) => {
      const box = section.getBoundingClientRect();
      x = event.clientX - box.left;
      y = event.clientY - box.top;
      spot.style.setProperty("--so", "1");
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => spot.style.setProperty("--so", "0");

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="hero-spotlight" aria-hidden="true" />;
}
