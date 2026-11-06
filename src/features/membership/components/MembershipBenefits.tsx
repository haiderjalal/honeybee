import { Check, Info } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MEMBERSHIP_BENEFITS, MEMBERSHIP_COPY, MEMBERSHIP_RULES } from "@/constants/membershipContent";

/** What members get, and the rules that decide when a discount applies. Both are visible before any payment. */
export function MembershipBenefits() {
  return (
    <section aria-labelledby="benefits-title" className="py-16">
      <Container className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-6">
          <SectionHeading id="benefits-title" eyebrow="Benefits" title="What members get" align="left" />
          <ul className="flex flex-col gap-4 rounded-3xl border border-cream-50/10 bg-forest-900/60 p-6 sm:p-8">
            {MEMBERSHIP_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-cream-100">
                <Check className="mt-1 size-4 shrink-0 text-gold-400" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          <SectionHeading id="rules-title" eyebrow="Rules" title="Eligibility and limits" align="left" />
          <ul
            aria-labelledby="rules-title"
            className="flex flex-col gap-4 rounded-3xl border border-cream-50/10 bg-forest-900/60 p-6 sm:p-8"
          >
            {MEMBERSHIP_RULES.map((rule) => (
              <li key={rule} className="flex gap-3 text-cream-300">
                <Info className="mt-1 size-4 shrink-0 text-cream-500" aria-hidden="true" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="mt-12">
        <aside
          aria-labelledby="illustration-title"
          className="max-w-3xl rounded-3xl border border-gold-400/20 bg-forest-800/50 p-6 sm:p-8"
        >
          <h2 id="illustration-title" className="font-display text-3xl text-cream-50">
            {MEMBERSHIP_COPY.illustrationTitle}
          </h2>
          <p className="mt-4 text-lg text-cream-300">{MEMBERSHIP_COPY.illustrationBody}</p>
          <p className="mt-3 text-sm text-cream-500">{MEMBERSHIP_COPY.illustrationCaveat}</p>
        </aside>
      </Container>
    </section>
  );
}
