import { Check } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { MEMBERSHIP } from "@/constants/membership";
import { MEMBERSHIP_COPY } from "@/constants/membershipContent";
import { formatPkr } from "@/utils/formatPkr";

const feeText = formatPkr(MEMBERSHIP.feeMinor / 100);

/**
 * Membership introduction and fee summary. The join button stays disabled until the membership join flow exists
 * and every launch requirement is complete (see the sales gate). It never leads to a payment today.
 */
export function MembershipHero() {
  return (
    <section aria-labelledby="membership-title" className="pt-32 pb-16">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">{MEMBERSHIP_COPY.eyebrow}</p>
          <h1 id="membership-title" className="font-display text-5xl leading-none text-cream-50 sm:text-7xl">
            {MEMBERSHIP_COPY.headline}
          </h1>
          <p className="text-lg text-cream-300">{MEMBERSHIP_COPY.intro}</p>
          <p className="text-sm text-cream-500">{MEMBERSHIP_COPY.feeNote}</p>
        </div>

        <aside
          aria-labelledby="fee-title"
          className="rounded-3xl border border-gold-400/25 bg-forest-800/60 p-6 sm:p-8"
        >
          <h2 id="fee-title" className="text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">
            {MEMBERSHIP.name}
          </h2>
          <p className="mt-4 font-display text-5xl text-gold-300 tabular-nums">{feeText}</p>
          <p className="mt-1 text-cream-300">per year, paid once upfront</p>

          <ul className="mt-6 flex flex-col gap-3 text-cream-100">
            <li className="flex gap-3">
              <Check className="mt-1 size-4 shrink-0 text-gold-400" aria-hidden="true" />
              <span>Up to {MEMBERSHIP.discountAllowance} discounted orders in a 12-month term</span>
            </li>
            <li className="flex gap-3">
              <Check className="mt-1 size-4 shrink-0 text-gold-400" aria-hidden="true" />
              <span>Early access to selected new batches</span>
            </li>
          </ul>

          <Button disabled aria-describedby="join-note" className="mt-8 w-full" size="lg">
            {MEMBERSHIP_COPY.joinLabel}
          </Button>
          <p id="join-note" className="mt-3 text-sm text-cream-500">
            {MEMBERSHIP_COPY.joinUnavailable}
          </p>
        </aside>
      </Container>
    </section>
  );
}
