import type { CSSProperties } from "react";

import { Bee } from "@/components/art/Bee";
import { Honeycomb } from "@/components/art/Honeycomb";
import { HoneyJar } from "@/components/art/HoneyJar";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SECTION_IDS } from "@/constants/routes";
import { getVarieties } from "@/services/catalog.service";
import { honeyStyle } from "@/utils/honeyStyle";

import { RevealWords } from "@/components/shared/RevealWords";

import { HeroBackdrop } from "./HeroBackdrop";
import { HeroSpotlight } from "./HeroSpotlight";

const ORBITS = [
  {
    path: "path('M 40 260 C 120 40, 420 20, 470 220 S 260 470, 40 260')",
    duration: "13s",
    delay: "0s",
    size: "size-14",
  },
  {
    path: "path('M 460 120 C 300 -40, 40 80, 90 260 S 420 420, 460 120')",
    duration: "17s",
    delay: "-6s",
    size: "size-10",
  },
  {
    path: "path('M 250 30 C 520 120, 480 420, 250 440 S -20 160, 250 30')",
    duration: "21s",
    delay: "-11s",
    size: "size-12",
  },
];

const reveal = (index: number): CSSProperties => ({ "--i": index }) as CSSProperties;

export function Hero() {
  const [signature] = getVarieties();

  return (
    <section
      aria-labelledby="hero-title"
      data-pause-offscreen
      className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 lg:min-h-[100svh] lg:pb-28"
    >
      <HeroBackdrop />
      <HeroSpotlight />

      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10 flex flex-col items-start gap-7">
          <p
            className="hero-reveal flex items-center gap-3 rounded-full border border-gold-400/30 bg-forest-900/60 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-gold-300 uppercase backdrop-blur"
            style={reveal(0)}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-400 shadow-[0_0_12px_#f6bd3c]" />
            Raw honey · Delivered across Pakistan
          </p>

          <h1
            id="hero-title"
            className="hero-reveal font-display text-5xl leading-[0.95] font-medium tracking-tight text-balance text-cream-50 sm:text-7xl xl:text-8xl"
            style={reveal(1)}
          >
            <RevealWords text="Liquid gold," />{" "}
            <RevealWords text="straight from the hive." className="text-gold italic" startAt={2} />
          </h1>

          <p className="hero-reveal max-w-xl text-lg text-pretty text-cream-300 sm:text-xl" style={reveal(2)}>
            Sidr, Acacia and Wildflower honey — poured into 500 g, 1 kg and 2 kg jars and delivered to your door.
            Harvest a comb, drop jars in your hive and we&apos;ll do the rest.
          </p>

          <div className="hero-reveal flex flex-wrap gap-3" style={reveal(3)}>
            <ButtonLink href={`#${SECTION_IDS.lab}`} size="lg">
              Build your order
            </ButtonLink>
            <ButtonLink href={`#${SECTION_IDS.pour}`} size="lg" variant="secondary">
              Watch the pour
            </ButtonLink>
          </div>

          <dl
            className="hero-reveal mt-4 grid grid-cols-3 gap-6 border-t border-cream-50/10 pt-6 sm:gap-10"
            style={reveal(4)}
          >
            {[
              ["3", "Pure varieties"],
              ["3", "Jar sizes"],
              ["100%", "Raw honey"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-xs tracking-wide text-cream-500 uppercase">{label}</dt>
                <dd className="font-display text-3xl text-gold-300 sm:text-4xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="hero-reveal relative mx-auto aspect-square w-full max-w-[34rem]"
          style={{ ...reveal(2), ...honeyStyle(signature.palette) }}
        >
          <div className="glow-pulse absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgb(246_189_60/0.45),transparent_65%)] blur-2xl" />
          <Honeycomb className="parallax-slow absolute top-[2%] left-[0%] w-[46%] -rotate-12 opacity-90" dripping />
          <Honeycomb className="parallax-fast absolute right-[2%] bottom-[8%] w-[30%] rotate-12 opacity-70" />
          <div className="float-bob absolute inset-x-[22%] top-[14%] bottom-[4%]">
            <HoneyJar
              className="size-full drop-shadow-[0_30px_50px_rgb(0_0_0/0.6)]"
              fill={0.86}
              label={{ title: signature.name.replace(" Honey", ""), subtitle: "2 kg · Raw honey" }}
            />
          </div>
          <div className="absolute inset-0" aria-hidden="true">
            {ORBITS.map((orbit) => (
              <div
                key={orbit.path}
                className={`bee-orbit absolute top-0 left-0 ${orbit.size}`}
                style={
                  {
                    offsetPath: orbit.path,
                    "--orbit-duration": orbit.duration,
                    "--orbit-delay": orbit.delay,
                  } as CSSProperties
                }
              >
                <Bee className="size-full" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
