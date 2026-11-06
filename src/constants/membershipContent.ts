import { MEMBERSHIP } from "@/constants/membership";
import { formatPkr, formatPkrMinor } from "@/utils/formatPkr";

import type { FaqItem } from "@/constants/content";
import type { MembershipIneligibleReason } from "@/types/membership";

/**
 * Membership copy. Every number is read from `MEMBERSHIP`, so a rule change updates the page and FAQ together.
 * Undecided policy is deliberately absent: nothing here promises a refund or cancellation term that is not agreed.
 */

const feeText = formatPkr(MEMBERSHIP.feeMinor / 100);
const maxDiscountText = formatPkr(MEMBERSHIP.maxDiscountPerOrderMinor / 100);
const minSubtotalText = formatPkr(MEMBERSHIP.minEligibleSubtotalMinor / 100);
const discountPercentText = `${MEMBERSHIP.discountRateBps / 100}%`;

export const MEMBERSHIP_COPY = {
  eyebrow: "Membership",
  headline: "Join The HonyB Hive",
  intro: `One yearly membership for ${feeText}. Every member gets ${discountPercentText} off eligible honey, early access to selected batches and optional reorder reminders.`,
  feeNote: "The fee buys member benefits for 12 months. It is not a honey delivery subscription.",
  joinLabel: "Join the Hive",
  joinUnavailable: "Membership sign-ups are not open yet. We will announce the opening date on the site.",
  illustrationTitle: "How the discount adds up",
  illustrationBody: `A ${formatPkr(3499)} eligible jar saves ${formatPkrMinor(34_990)} on each qualifying purchase. Three separate qualifying purchases like that recover the ${feeText} fee through discounts alone.`,
  illustrationCaveat:
    "This is an illustration. Savings only count once an order is fulfilled, and discounts you have not used lapse when your term ends.",
  calculatorTitle: "Savings calculator",
  calculatorIntro: "Pick a jar and a quantity to see what membership would save on one order, at today's prices.",
  calculatorCaveat:
    "Estimates use current catalogue prices and assume the same basket each time. Savings count only once orders are fulfilled.",
} as const;

export const MEMBERSHIP_BENEFITS: readonly string[] = [
  `${discountPercentText} off eligible honey at regular price, up to ${maxDiscountText} per order`,
  `Up to ${MEMBERSHIP.discountAllowance} discounted orders in every 12-month term`,
  "Early access to selected new batches before public release",
  "Optional reorder reminders, only if you opt in separately",
];

export const MEMBERSHIP_RULES: readonly string[] = [
  `An order qualifies once its regular-price honey subtotal reaches ${minSubtotalText}.`,
  "Each discounted order uses one of your allowance. Ordering without the discount never uses one.",
  "Sale jars, delivery, membership fees, gift cards and non-honey items are not eligible.",
  "The membership discount does not combine with coupons, sale prices or other promotions. Each order gets the single best offer, and checkout explains which one applies.",
  "The membership does not include free delivery, a free jar, points or referral rewards.",
  "Renewal is manual. We never charge you automatically.",
  "Early access helps you see new batches first. It does not guarantee stock.",
];

/** Checkout explanation for each reason a member discount does not apply. Never blocks the order itself. */
export const MEMBERSHIP_OUTCOME_COPY: Record<Exclude<MembershipIneligibleReason, "below_minimum">, string> = {
  no_membership: "Join The HonyB Hive to unlock member discounts on eligible honey.",
  term_not_active: "Your membership is not active right now, so this order is at regular prices.",
  allowance_used: "You have used all six discounted orders for this term.",
  no_eligible_items: "Member discounts apply to honey at regular price. Jars on sale are not eligible.",
};

/** Adds the amount still needed to reach the minimum, for the "below minimum" explanation. */
export function getBelowMinimumCopy(shortfallMinor: number): string {
  return `Add ${formatPkrMinor(shortfallMinor)} more regular-price honey to unlock your member discount on this order.`;
}

export function getMembershipFaq(): readonly FaqItem[] {
  return [
    {
      question: "When does my membership start?",
      answer:
        "Your 12-month term starts when we have verified your fee payment, not when you submit it. You only get member benefits after that.",
    },
    {
      question: "When does my membership expire?",
      answer:
        "A term runs for 12 calendar months from activation, in Pakistan time. Discounts you have not used lapse when the term ends.",
    },
    {
      question: "How do renewals work?",
      answer: `Renewal is always manual. When your term expires, you can renew for ${feeText}. A renewal starts a new 12-month term with ${MEMBERSHIP.discountAllowance} discounted orders. We never charge you automatically.`,
    },
    {
      question: "Does membership include free delivery?",
      answer:
        "No. Delivery charges are never part of the discount, and this version of membership has no free delivery, free jar, points scheme or referral reward.",
    },
    {
      question: "Can I use the membership with sale prices or coupons?",
      answer:
        "No. Each order gets one offer: the membership discount or another promotion, whichever saves more. Checkout shows which offer applies and why. Jars already on sale are not eligible for the membership discount.",
    },
    {
      question: "What happens if I cancel an order?",
      answer:
        "If you cancel a discounted order before it is fulfilled, its discount is released and the allowance returns to your term. A discounted order that is refunded in full returns its allowance to the same term, without extending it.",
    },
    {
      question: "Is membership a honey delivery subscription?",
      answer:
        "No. The fee buys member benefits for 12 months. You still choose and confirm every jar you order, and delivery is arranged for each order.",
    },
    {
      question: "Do I need membership to order honey?",
      answer: "No. Ordering honey works the same for everyone. Membership only adds the discount on eligible orders.",
    },
    {
      question: "Will you send me reminders?",
      answer:
        "Only with your consent. Renewal reminders go out 30 and 7 days before your term ends. Reorder reminders need a separate opt-in, and you can withdraw either one at any time.",
    },
  ];
}
