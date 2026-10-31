import { Flower2, Leaf, PackageCheck, Phone } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PROMISES } from "@/constants/content";

import type { CSSProperties } from "react";

const ICONS = [Leaf, Flower2, PackageCheck, Phone] as const;

export function Promises() {
  return (
    <section
      aria-labelledby="promises-title"
      className="defer-render py-24"
      style={{ "--defer-height": "700px" } as CSSProperties}
    >
      <Container>
        <SectionHeading
          id="promises-title"
          eyebrow="The Honeybee promise"
          title={
            <>
              Honey you can <span className="text-gold italic">trust.</span>
            </>
          }
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((promise, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <li key={promise.title}>
                <Reveal delay={index * 0.08} className="h-full">
                  <div className="h-full rounded-3xl border border-cream-50/10 bg-forest-900/60 p-7">
                    <span className="grid size-12 place-items-center rounded-2xl bg-gold-400/10 text-gold-300 ring-1 ring-gold-400/30">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-2xl text-cream-50">{promise.title}</h3>
                    <p className="mt-2 text-cream-300">{promise.body}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
