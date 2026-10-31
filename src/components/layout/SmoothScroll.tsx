"use client";

import { useEffect } from "react";

import { INTRO_DONE_EVENT } from "@/features/intro/introState";

/** Inertial page scrolling via Lenis. Skipped for reduced-motion users and while the intro runs. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let destroyed = false;
    let destroy: (() => void) | undefined;

    const start = () =>
      void import("lenis").then(({ default: Lenis }) => {
        if (destroyed) return;
        const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -80 } });
        const raf = (time: number) => {
          lenis.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
        destroy = () => {
          cancelAnimationFrame(frame);
          lenis.destroy();
        };
      });

    // Lenis scrolls programmatically, which would bypass the intro's overflow lock.
    const introPlaying = document.documentElement.dataset.intro === "playing";
    if (introPlaying) window.addEventListener(INTRO_DONE_EVENT, start, { once: true });
    else start();

    return () => {
      destroyed = true;
      window.removeEventListener(INTRO_DONE_EVENT, start);
      destroy?.();
    };
  }, []);

  return null;
}
