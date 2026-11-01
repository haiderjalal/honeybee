import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { CheckoutView } from "@/features/inquiry/CheckoutView";

export const metadata: Metadata = {
  title: "Send your order request",
  description:
    "Review your hive and send an order request. We confirm delivery and payment with you by phone — nothing is charged online.",
  alternates: { canonical: "/checkout" },
  // A personal, cart-dependent page: keep it out of search results.
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <Container className="pt-32 pb-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-forest-800 uppercase">Almost there</p>
        <h1 className="mt-3 font-display text-5xl text-forest-950 sm:text-6xl">Send your order request</h1>
        <p className="mt-4 text-lg text-forest-900/85">
          Tell us where to deliver. We&apos;ll call you to confirm everything before your honey ships.
        </p>
      </header>
      <CheckoutView />
    </Container>
  );
}
