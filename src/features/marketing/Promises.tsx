import { Flower2, Leaf, PackageCheck, Phone, type LucideIcon } from "lucide-react";

import { HoneyJar } from "@/components/art/HoneyJar";
import { Honeycomb } from "@/components/art/Honeycomb";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { HONEY_VARIETIES } from "@/constants/catalog";
import { PROMISES } from "@/constants/content";
import { cn } from "@/utils/cn";

import type { CSSProperties } from "react";

type PromiseId = (typeof PROMISES)[number]["id"];

interface PromisePresentation {
  icon: LucideIcon;
  tone: "gold" | "sage";
  /** Grid span from the md breakpoint up: a 4 + 2 row, then 2 + 4, gives the cards a staggered rhythm. */
  span: string;
}

const PRESENTATION: Record<PromiseId, PromisePresentation> = {
  raw: { icon: Leaf, tone: "gold", span: "md:col-span-4" },
  varieties: { icon: Flower2, tone: "sage", span: "md:col-span-2" },
  sealed: { icon: PackageCheck, tone: "sage", span: "md:col-span-2" },
  confirmation: { icon: Phone, tone: "gold", span: "md:col-span-4" },
};

/** Small illustration per promise, so each card has its own visual rather than a generic icon. */
function PromiseArt({ id }: { id: PromiseId }) {
  switch (id) {
    case "raw":
      return <Honeycomb className="float-bob w-28 sm:w-36" dripping />;
    case "varieties":
      return (
        <ul className="flex flex-col gap-2">
          {HONEY_VARIETIES.map((variety) => (
            <li
              key={variety.slug}
              className="flex items-center gap-3 rounded-full border border-cream-50/10 bg-forest-950/60 py-1.5 pr-4 pl-1.5 text-sm text-cream-100"
            >
              <span
                aria-hidden="true"
                className="size-7 rounded-full ring-1 ring-white/20"
                style={{ background: `linear-gradient(135deg, ${variety.palette.light}, ${variety.palette.deep})` }}
              />
              {variety.name.replace(" Honey", "")}
            </li>
          ))}
        </ul>
      );
    case "sealed":
      return (
        <div className="float-bob w-16 sm:w-20">
          <HoneyJar className="w-full" fill={0.9} />
        </div>
      );
    case "confirmation":
      return (
        <div className="flex flex-wrap justify-end gap-2">
          {["Call", "WhatsApp"].map((channel) => (
            <span
              key={channel}
              className="rounded-full border border-sage-300/30 bg-sage-500/10 px-3 py-1.5 text-sm text-sage-200"
            >
              {channel}
            </span>
          ))}
          <span
            className="pulse-ring relative mt-2 ml-2 inline-block size-3 rounded-full bg-sage-300"
            aria-hidden="true"
          />
        </div>
      );
  }
}

function PromiseCard({ promise, index }: { promise: (typeof PROMISES)[number]; index: number }) {
  const { icon: Icon, tone } = PRESENTATION[promise.id];
  const isGold = tone === "gold";

  return (
    <Reveal delay={index * 0.08} className="h-full">
      <article
        className={cn(
          "sheen group relative flex h-full min-h-72 flex-col justify-between overflow-hidden rounded-[2rem] border p-7 transition-[border-color,translate] duration-500 hover:-translate-y-1 sm:p-9",
          isGold
            ? "border-gold-400/20 bg-linear-to-br from-forest-800/80 to-forest-900/90 hover:border-gold-400/50"
            : "border-sage-400/20 bg-linear-to-br from-forest-800/70 to-forest-950/90 hover:border-sage-300/50",
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -right-2 font-display text-[10rem] leading-none text-cream-50/[0.04] italic select-none"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative flex items-start justify-between gap-6">
          <span
            className={cn(
              "hex-badge grid size-16 place-items-center text-forest-950",
              isGold ? "bg-linear-to-b from-gold-200 to-gold-500" : "bg-linear-to-b from-sage-200 to-sage-500",
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <PromiseArt id={promise.id} />
        </div>

        <div className="relative mt-10">
          <h3 className="font-display text-3xl text-cream-50">{promise.title}</h3>
          <p className="mt-2 max-w-md text-cream-300">{promise.body}</p>
        </div>
      </article>
    </Reveal>
  );
}

export function Promises() {
  return (
    <section
      aria-labelledby="promises-title"
      className="defer-render py-28"
      style={{ "--defer-height": "900px" } as CSSProperties}
    >
      <Container>
        <SectionHeading
          id="promises-title"
          eyebrow="The HonyB promise"
          title={
            <>
              Honey you can <span className="text-gold italic">trust.</span>
            </>
          }
          description="Four promises we keep on every jar, from the hive to your door."
        />
        <ul className="mt-16 grid gap-5 md:grid-cols-6">
          {PROMISES.map((promise, index) => (
            <li key={promise.id} className={PRESENTATION[promise.id].span}>
              <PromiseCard promise={promise} index={index} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
