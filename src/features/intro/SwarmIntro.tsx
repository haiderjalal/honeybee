"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

import { finishIntro } from "./introState";

type Phase = "assemble" | "burst" | "done";

/**
 * Full-screen opening sequence. The overlay markup is server-rendered (so it covers
 * the page from the first paint); the canvas engine is code-split and only loaded
 * when the head gate script decided the intro should play.
 */
export function SwarmIntro() {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("assemble");

  useEffect(() => {
    // When the gate script skipped the intro, CSS already hides the overlay.
    if (document.documentElement.dataset.intro !== "playing") return;

    let cancel: (() => void) | undefined;
    let cancelled = false;
    const complete = () => {
      setPhase("done");
      finishIntro();
    };

    // A fresh canvas per run: control of a canvas can be transferred to a worker only once.
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 size-full";
    canvas.setAttribute("aria-hidden", "true");
    canvasHostRef.current?.append(canvas);

    void import("./runSwarm").then(({ runSwarm }) => {
      if (cancelled) return;
      cancel = runSwarm(canvas, { onBurst: () => setPhase("burst"), onComplete: complete });
    });

    // A resize mid-intro would distort the comb; just reveal the site instead.
    const onResize = () => {
      cancel?.();
      complete();
    };
    window.addEventListener("resize", onResize, { once: true });

    return () => {
      cancelled = true;
      cancel?.();
      canvas.remove();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (phase === "done") return null;

  const skip = () => {
    setPhase("done");
    finishIntro();
  };

  return (
    <div
      className={cn(
        "intro-overlay fixed inset-0 z-[100] place-items-center bg-forest-950",
        "bg-[radial-gradient(60rem_40rem_at_50%_50%,rgb(224_154_18/0.12),transparent_70%)]",
        phase === "burst" && "is-bursting",
      )}
      data-testid="intro-overlay"
    >
      <div ref={canvasHostRef} className="absolute inset-0" />
      <div className="intro-wordmark pointer-events-none relative text-center" aria-hidden="true">
        <p className="font-display text-6xl font-medium tracking-tight text-cream-50 drop-shadow-[0_4px_30px_rgb(0_0_0/0.7)] sm:text-8xl">
          Honeybee
        </p>
        <p className="mx-auto mt-4 w-fit rounded-full bg-forest-950/75 px-4 py-1.5 text-xs font-semibold tracking-[0.4em] text-gold-200 uppercase sm:text-sm">
          Raw honey · Pakistan
        </p>
      </div>
      <button
        type="button"
        onClick={skip}
        className="absolute right-5 bottom-5 rounded-full border border-cream-50/25 bg-forest-950/50 px-5 py-2.5 text-sm text-cream-100 backdrop-blur transition-colors hover:border-gold-300 hover:text-gold-300"
      >
        Skip intro
      </button>
    </div>
  );
}
