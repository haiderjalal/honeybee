"use client";

import { useEffect } from "react";

/**
 * Marks `[data-pause-offscreen]` sections with `data-offscreen` while they are out of view,
 * which pauses their CSS animations (SVG transforms repaint on the main thread every frame).
 */
export function PauseOffscreen() {
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-pause-offscreen]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
        }
      },
      { rootMargin: "200px 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return null;
}
