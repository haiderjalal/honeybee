"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState } from "react";

import { Bee } from "@/components/art/Bee";
import { SECTION_IDS } from "@/constants/routes";
import { honeyStyle } from "@/utils/honeyStyle";

import { CombPicker } from "./CombPicker";
import { DraggableJar } from "./DraggableJar";

import type { HoneyVariety, JarSize } from "@/types/catalog";

export type LabPhase = "idle" | "harvesting" | "ready";

const STATUS: Record<LabPhase, (name: string) => string> = {
  idle: () => "Tap a honeycomb to start the harvest.",
  harvesting: (name) => `The bee is harvesting ${name}…`,
  ready: (name) => `${name} is ready. Drag a jar into your hive — or tap Add to hive.`,
};

const EASE_POUR = [0.33, 0, 0.2, 1] as const;

interface HoneyLabProps {
  varieties: readonly HoneyVariety[];
  sizes: readonly JarSize[];
}

/** Relative centre of an element inside the lab container. */
function centerWithin(container: HTMLElement, element: Element): { x: number; y: number; top: number; bottom: number } {
  const box = container.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - box.left + rect.width / 2,
    y: rect.top - box.top + rect.height / 2,
    top: rect.top - box.top,
    bottom: rect.bottom - box.top,
  };
}

export function HoneyLab({ varieties, sizes }: HoneyLabProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<LabPhase>("idle");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [tintSlug, setTintSlug] = useState(varieties[0].slug);
  const combRefs = useRef(new Map<string, HTMLElement>());
  const jarRefs = useRef(new Map<string, HTMLElement>());
  const busy = useRef(false);

  const tint = varieties.find((v) => v.slug === tintSlug) ?? varieties[0];
  const selected = varieties.find((v) => v.slug === selectedSlug) ?? null;

  const harvest = useCallback(
    async (slug: string) => {
      const container = scope.current;
      const comb = combRefs.current.get(slug);
      if (busy.current || !container || !comb) return;
      if (slug === selectedSlug && phase === "ready") return;

      busy.current = true;
      setSelectedSlug(slug);
      setPhase("harvesting");
      const jars = sizes.map((size) => jarRefs.current.get(size.id)).filter((el): el is HTMLElement => Boolean(el));

      try {
        if (reduceMotion) {
          setTintSlug(slug);
          await animate(jars, { "--fill": 1, "--lid": 1 }, { duration: 0 });
          return;
        }

        if (phase !== "idle") {
          await animate(jars, { "--lid": 0 }, { duration: 0.25 });
          await animate(jars, { "--fill": 0 }, { duration: 0.45, ease: "easeIn" });
        }
        setTintSlug(slug);

        const combPos = centerWithin(container, comb);
        await animate(
          "[data-lab-bee]",
          { x: combPos.x - 28, y: combPos.top - 30, rotate: 0 },
          { type: "spring", stiffness: 70, damping: 13, mass: 0.9 },
        );
        await animate(
          "[data-lab-bee]",
          { rotate: [0, -12, 10, -8, 6, 0], scale: [1, 1.1, 1, 1.1, 1] },
          { duration: 0.7 },
        );

        await Promise.all(
          jars.map((jar, index) => {
            const jarPos = centerWithin(container, jar);
            const drip = container.querySelector<HTMLElement>(`[data-lab-drip="${index}"]`);
            const fall = drip
              ? animate(
                  drip,
                  {
                    x: [combPos.x, jarPos.x],
                    y: [combPos.bottom - 10, jarPos.top + 20],
                    opacity: [0, 1, 1, 0],
                    scaleY: [0.4, 1.3, 1.5, 0.6],
                  },
                  { duration: 0.8, delay: index * 0.14, ease: "easeIn" },
                )
              : Promise.resolve();
            const pour = animate(
              jar,
              { "--fill": [0, 1] },
              { duration: 1.2, delay: 0.55 + index * 0.14, ease: EASE_POUR },
            );
            return Promise.all([fall, pour]).then(() =>
              animate(jar, { "--lid": [0, 1] }, { duration: 0.4, ease: "backOut" }),
            );
          }),
        );

        void animate("[data-lab-bee]", { x: 12, y: -10, rotate: -8 }, { type: "spring", stiffness: 50, damping: 12 });
      } finally {
        busy.current = false;
        setPhase("ready");
      }
    },
    [animate, phase, reduceMotion, scope, selectedSlug, sizes],
  );

  const statusName = selected?.name ?? "";

  return (
    <div ref={scope} className="relative" style={honeyStyle(tint.palette)}>
      <div data-lab-bee className="pointer-events-none absolute top-0 left-0 z-20 w-14 sm:w-16" aria-hidden="true">
        <div className="float-bob">
          <Bee className="w-full" />
        </div>
      </div>

      {sizes.map((size, index) => (
        <span
          key={size.id}
          data-lab-drip={index}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-10 -ml-2 h-6 w-4 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] opacity-0"
          style={{ background: "linear-gradient(180deg, var(--honey-light), var(--honey-base))" }}
        />
      ))}

      <CombPicker
        varieties={varieties}
        selectedSlug={selectedSlug}
        harvesting={phase === "harvesting"}
        onPick={harvest}
        registerComb={(slug, el) => {
          if (el) combRefs.current.set(slug, el);
          else combRefs.current.delete(slug);
        }}
      />

      <p className="mt-10 min-h-7 text-center text-cream-300" aria-live="polite" id={`${SECTION_IDS.lab}-status`}>
        {STATUS[phase](statusName)}
      </p>

      <div className="relative mt-6 rounded-[2rem] border border-gold-400/15 bg-linear-to-b from-ink-800/70 to-ink-900/80 px-4 pt-10 pb-6 sm:px-10">
        <ul className="grid grid-cols-3 items-end gap-3 sm:gap-8" aria-label="Jar sizes">
          {sizes.map((size) => (
            <DraggableJar
              key={size.id}
              size={size}
              variety={selected}
              ready={phase === "ready" && selected !== null}
              registerJar={(el) => {
                if (el) jarRefs.current.set(size.id, el);
                else jarRefs.current.delete(size.id);
              }}
            />
          ))}
        </ul>
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-3 rounded-full bg-linear-to-r from-gold-600/40 via-gold-400/70 to-gold-600/40 shadow-[0_10px_30px_-5px_rgb(224_154_18/0.5)]"
        />
      </div>
    </div>
  );
}
