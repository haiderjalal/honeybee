"use client";

import {
  AnimatePresence,
  m,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from "motion/react";
import { useRef, useState, type CSSProperties } from "react";

import { Bee } from "@/components/art/Bee";
import { Honeycomb } from "@/components/art/Honeycomb";
import { HoneyJar } from "@/components/art/HoneyJar";
import { Container } from "@/components/layout/Container";
import { SECTION_IDS } from "@/constants/routes";
import { formatPkr } from "@/utils/formatPkr";
import { honeyStyle } from "@/utils/honeyStyle";
import { cn } from "@/utils/cn";

import { VarietySwitcher } from "./VarietySwitcher";
import { activeStageAt, jarFillAt, jarLidAt, streamOpacityAt, streamXKeyframes } from "./pourTimeline";

import type { HoneyVariety, JarSize } from "@/types/catalog";

const STAGE = { width: 1200, height: 800, floor: 770, jarWidth: 250, jarHeight: 375 } as const;
const JAR_CENTERS = [250, 600, 950] as const;
const STREAM_TOP = 150;

const STAGE_COPY: Record<JarSize["id"], { heading: string; body: string }> = {
  "500g": { heading: "The taster", body: "Half a kilo to discover a honey you'll come back for." },
  "1kg": { heading: "The family jar", body: "Our most-loved size — enough for a month of breakfasts and chai." },
  "2kg": { heading: "The pantry reserve", body: "Best value per kilo, for honey lovers and generous gifts." },
};

interface PourStoryProps {
  varieties: readonly HoneyVariety[];
  sizes: readonly JarSize[];
}

export function PourStory({ varieties, sizes }: PourStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [varietySlug, setVarietySlug] = useState(varieties[0].slug);
  const [stage, setStage] = useState(0);
  const variety = varieties.find((v) => v.slug === varietySlug) ?? varieties[0];

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.0005 });
  const completed = useMotionValue(1);
  const progress = reduceMotion ? completed : smoothProgress;

  const count = sizes.length;
  const { input, output } = streamXKeyframes(JAR_CENTERS.slice(0, count));
  const streamX = useTransform(progress, input, output);
  const streamOpacity = useTransform(progress, (p) => streamOpacityAt(p, count));

  useMotionValueEvent(progress, "change", (p) => {
    const next = activeStageAt(p, count);
    if (next !== stage) setStage(next);
  });

  const activeSize = sizes[reduceMotion ? count - 1 : stage];
  const copy = STAGE_COPY[activeSize.id];

  return (
    <section
      ref={sectionRef}
      id={SECTION_IDS.pour}
      aria-labelledby="pour-title"
      data-pause-offscreen
      // Rendering is skipped until the section nears the viewport; its height is explicit so nothing shifts.
      className={cn("defer-render relative", reduceMotion ? "py-24" : "h-[420vh]")}
      style={{ ...honeyStyle(variety.palette), "--defer-height": "420vh" } as CSSProperties}
    >
      <div className={cn("flex flex-col justify-center overflow-hidden", !reduceMotion && "sticky top-0 h-svh pt-18")}>
        <Container className="grid items-center gap-6 lg:grid-cols-[0.8fr_1.4fr] lg:gap-10">
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.3em] text-forest-800 uppercase">The pour</p>
            <h2
              id="pour-title"
              className="font-display text-4xl leading-[1.02] font-medium text-forest-950 sm:text-5xl lg:text-6xl"
            >
              Poured fresh, <span className="text-amber-800 italic">jar by jar.</span>
            </h2>
            <VarietySwitcher varieties={varieties} value={varietySlug} onChange={setVarietySlug} />

            <div className="relative min-h-36" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={`${activeSize.id}-${variety.slug}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="font-display text-5xl text-amber-800 sm:text-6xl">{activeSize.label}</p>
                  <p className="mt-1 text-xl text-forest-950">
                    {copy.heading} · <span className="tabular-nums">{formatPkr(variety.prices[activeSize.id])}</span>
                  </p>
                  <p className="mt-2 max-w-sm text-forest-900/85">{copy.body}</p>
                </m.div>
              </AnimatePresence>
            </div>

            {!reduceMotion ? (
              <ol className="flex gap-2" aria-label="Pour progress">
                {sizes.map((size, index) => (
                  <li
                    key={size.id}
                    aria-current={index === stage ? "step" : undefined}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      index === stage ? "w-12 bg-gold-400" : index < stage ? "w-6 bg-gold-600" : "w-6 bg-forest-950/20",
                    )}
                  >
                    <span className="visually-hidden">{size.label}</span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>

          <svg
            // Cropped to the jars' extent so the scene stays large on narrow screens.
            viewBox={`100 0 ${STAGE.width - 200} ${STAGE.height}`}
            className="max-h-[58svh] w-full rounded-[2rem] border border-forest-950/10 bg-cream-50/85 p-4 lg:max-h-[78svh]"
            role="img"
            aria-label={`${variety.name} pouring into ${sizes.map((s) => s.label).join(", ")} jars`}
          >
            <defs>
              <linearGradient id="pour-stream" x1="0" x2="1">
                <stop offset="0%" style={{ stopColor: "var(--honey-deep)" }} />
                <stop offset="45%" style={{ stopColor: "var(--honey-light)" }} />
                <stop offset="100%" style={{ stopColor: "var(--honey-base)" }} />
              </linearGradient>
            </defs>

            <ellipse cx="600" cy={STAGE.floor + 8} rx="560" ry="22" fill="#000" opacity="0.35" />
            <line
              x1="40"
              x2="1160"
              y1={STAGE.floor}
              y2={STAGE.floor}
              stroke="#f6bd3c"
              strokeOpacity="0.25"
              strokeWidth="2"
            />

            <m.g style={{ x: streamX, opacity: streamOpacity }}>
              <path
                d={`M-8 ${STREAM_TOP} C-6 300 -4 500 -5 ${STAGE.floor - 30} H5 C4 500 6 300 8 ${STREAM_TOP} Z`}
                fill="url(#pour-stream)"
              />
              <line
                className="honey-flow"
                x1="-2"
                x2="-2"
                y1={STREAM_TOP}
                y2={STAGE.floor - 30}
                stroke="#fff3cf"
                strokeOpacity="0.55"
                strokeWidth="2"
                strokeDasharray="10 38"
              />
            </m.g>

            {sizes.map((size, index) => (
              <PourJar
                key={size.id}
                index={index}
                count={count}
                progress={progress}
                size={size}
                centerX={JAR_CENTERS[index]}
                price={formatPkr(variety.prices[size.id])}
              />
            ))}

            <m.g style={{ x: streamX }}>
              <svg x={-95} y={-10} width={190} height={190} className="overflow-visible">
                <Honeycomb dripping />
              </svg>
              <svg x={70} y={10} width={86} height={64} className="float-bob overflow-visible">
                <g transform="scale(-1 1) translate(-64 0)">
                  <Bee />
                </g>
              </svg>
            </m.g>
          </svg>
        </Container>
      </div>
    </section>
  );
}

interface PourJarProps {
  index: number;
  count: number;
  progress: MotionValue<number>;
  size: JarSize;
  centerX: number;
  price: string;
}

function PourJar({ index, count, progress, size, centerX, price }: PourJarProps) {
  const fill = useTransform(progress, (p) => jarFillAt(p, index, count));
  const lid = useTransform(progress, (p) => jarLidAt(p, index, count));
  const opacity = useTransform(progress, (p) =>
    index === 0 ? 1 : 0.4 + 0.6 * Math.min(1, Math.max(0, (p * count - index + 0.2) / 0.3)),
  );

  const width = STAGE.jarWidth * size.scale;
  const height = STAGE.jarHeight * size.scale;

  return (
    // CSS variables are inherited by the nested HoneyJar (see its --fill / --lid contract).
    <m.g style={{ "--fill": fill, "--lid": lid, opacity } as MotionStyle}>
      <HoneyJar
        x={centerX - width / 2}
        y={STAGE.floor - height}
        width={width}
        height={height}
        label={{ title: size.label, subtitle: price }}
      />
    </m.g>
  );
}
