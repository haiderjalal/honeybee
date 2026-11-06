import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { FaqAccordion } from "@/components/shared/FaqAccordion";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MEMBERSHIP } from "@/constants/membership";
import { getMembershipFaq, MEMBERSHIP_COPY } from "@/constants/membershipContent";
import { ROUTES } from "@/constants/routes";
import { MembershipBenefits } from "@/features/membership/components/MembershipBenefits";
import { MembershipHero } from "@/features/membership/components/MembershipHero";
import { SavingsCalculator, type CalculatorVariety } from "@/features/membership/components/SavingsCalculator";
import { getVarieties } from "@/services/catalog.service";
import { isMembershipSalesOpen } from "@/services/membership/membershipSalesGate";
import { formatPkr } from "@/utils/formatPkr";

const title = `${MEMBERSHIP.name} — yearly membership`;
const description = `${formatPkr(MEMBERSHIP.feeMinor / 100)} a year for 10% off eligible raw honey, up to six orders, plus early access to selected batches. Membership buys benefits, not a delivery subscription.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.membership },
  openGraph: { type: "website", url: ROUTES.membership, title, description },
  twitter: { card: "summary_large_image", title, description },
  // The page stays out of search results until sales are actually open.
  robots: { index: isMembershipSalesOpen(), follow: true },
};

/** Catalogue data the calculator needs, reduced to plain values for the client. */
function getCalculatorVarieties(): CalculatorVariety[] {
  return getVarieties().map((variety) => ({
    slug: variety.slug,
    name: variety.name,
    prices: variety.prices,
    listPrices: variety.listPrices,
  }));
}

export default function MembershipPage() {
  return (
    <>
      <MembershipHero />
      <MembershipBenefits />

      <section aria-labelledby="calculator-title" className="py-16">
        <Container className="max-w-6xl">
          <SectionHeading id="calculator-title" eyebrow="Savings" title={MEMBERSHIP_COPY.calculatorTitle} />
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-cream-300">{MEMBERSHIP_COPY.calculatorIntro}</p>
          <div className="mt-12">
            <SavingsCalculator varieties={getCalculatorVarieties()} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="membership-faq-title" className="py-16">
        <Container className="max-w-4xl">
          <SectionHeading id="membership-faq-title" eyebrow="Questions" title="Membership questions" />
          <div className="mt-12">
            <FaqAccordion items={getMembershipFaq()} groupName="membership-faq" />
          </div>
        </Container>
      </section>
    </>
  );
}
