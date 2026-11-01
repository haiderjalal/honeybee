import { Bee } from "@/components/art/Bee";
import { HoneyJar } from "@/components/art/HoneyJar";
import { Honeycomb } from "@/components/art/Honeycomb";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES, SECTION_IDS } from "@/constants/routes";

import type { HoneyVariety } from "@/types/catalog";

interface DiscoverHeroProps {
  variety: HoneyVariety;
}

/** Opening section of a discover page: the variety's story beside a round forest disc holding its jar. */
export function DiscoverHero({ variety }: DiscoverHeroProps) {
  const shortName = variety.name.replace(" Honey", "");

  return (
    <section aria-labelledby="discover-title" className="relative pt-10 pb-20 sm:pt-14 lg:pb-28">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-semibold tracking-[0.3em] text-forest-800 uppercase">
            Discover · {variety.localName} honey
          </p>
          <h1
            id="discover-title"
            className="font-display text-6xl leading-[0.95] font-medium text-balance text-forest-950 sm:text-7xl xl:text-8xl"
          >
            {variety.name}
          </h1>
          <p className="font-display text-2xl text-forest-800 italic sm:text-3xl">{variety.tagline}</p>
          <p className="max-w-xl text-lg text-pretty text-forest-900/85">{variety.description}</p>

          <div className="mt-2 flex flex-wrap gap-3">
            <ButtonLink
              href={ROUTES.variety(variety.slug)}
              size="lg"
              variant="secondary"
              className="border-forest-950 bg-forest-950 text-cream-50 hover:border-forest-800 hover:bg-forest-800"
            >
              Shop {shortName} honey
            </ButtonLink>
            <ButtonLink
              href={`/#${SECTION_IDS.varieties}`}
              size="lg"
              variant="ghost"
              className="text-forest-950 hover:text-forest-800"
            >
              All varieties
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div
            aria-hidden="true"
            className="absolute inset-[4%] rounded-full bg-forest-950 shadow-[0_40px_80px_-30px_rgb(6_19_14/0.7)]"
          />
          <Honeycomb className="float-bob absolute top-0 left-0 w-2/5 -rotate-12" dripping />
          <div className="float-bob absolute inset-x-[18%] top-[10%] bottom-[6%]">
            <HoneyJar
              className="size-full drop-shadow-[0_24px_36px_rgb(0_0_0/0.5)]"
              fill={0.9}
              label={{ title: variety.localName, subtitle: variety.colour }}
            />
          </div>
          <div aria-hidden="true" className="float-bob absolute top-[4%] right-[2%] w-14">
            <Bee className="w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
