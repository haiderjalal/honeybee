"use client";

import { m, useReducedMotion } from "motion/react";
import { useMemo } from "react";

import { HoneyJar } from "@/components/art/HoneyJar";
import { ButtonLink } from "@/components/ui/Button";
import { SECTION_IDS } from "@/constants/routes";
import { whatsappUrl } from "@/constants/site";
import { CartLineItem } from "@/features/cart/components/CartLineItem";
import { calculateSubtotal, toCartLines, useCartStore } from "@/features/cart/store/cartStore";
import { formatPkr } from "@/utils/formatPkr";

import { InquiryForm } from "./InquiryForm";
import { useInquirySubmit } from "./useInquirySubmit";

export function CheckoutView() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const clearCart = useCartStore((state) => state.clear);
  const lines = useMemo(() => toCartLines(items), [items]);
  const subtotal = calculateSubtotal(lines);
  const { status, reference, message, fieldErrors, submit } = useInquirySubmit();

  if (status === "success" && reference) return <SuccessState reference={reference} />;

  if (!hasHydrated) {
    return <div className="h-96 animate-pulse rounded-3xl bg-forest-800/50" aria-label="Loading your hive" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 rounded-3xl border border-cream-50/10 bg-forest-900/60 px-8 py-16 text-center">
        <div className="h-32 w-24">
          <HoneyJar fill={0} lid={0} className="size-full" />
        </div>
        <h2 className="font-display text-3xl text-cream-50">Your hive is empty</h2>
        <p className="text-cream-300">
          Harvest a honeycomb in the Honey Lab and add a jar or two before sending your request.
        </p>
        <ButtonLink href={`/#${SECTION_IDS.lab}`}>Go to the Honey Lab</ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
      <section
        aria-labelledby="details-title"
        className="rounded-3xl border border-cream-50/10 bg-forest-900/60 p-6 sm:p-10"
      >
        <h2 id="details-title" className="mb-6 font-display text-3xl text-cream-50">
          Your details
        </h2>
        <InquiryForm
          subtotal={subtotal}
          submitting={status === "submitting"}
          serverMessage={status === "error" ? message : null}
          serverErrors={fieldErrors}
          onSubmit={async (customer) => {
            if (await submit(customer, items)) clearCart();
          }}
        />
      </section>

      <aside
        aria-labelledby="summary-title"
        className="h-fit rounded-3xl border border-gold-400/20 bg-forest-800/60 p-6 sm:p-8 lg:sticky lg:top-24"
      >
        <h2 id="summary-title" className="font-display text-2xl text-cream-50">
          Order summary
        </h2>
        <ul className="divide-y divide-cream-50/10">
          {lines.map((line) => (
            <CartLineItem key={`${line.varietySlug}:${line.sizeId}`} line={line} />
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-cream-50/10 pt-4">
          <span className="text-cream-300">Subtotal</span>
          <span className="font-display text-3xl text-gold-300 tabular-nums" data-testid="checkout-subtotal">
            {formatPkr(subtotal)}
          </span>
        </div>
        <p className="mt-2 text-xs text-cream-500">Delivery charges, if any, are confirmed when we call you.</p>
      </aside>
    </div>
  );
}

function SuccessState({ reference }: { reference: string }) {
  const reduceMotion = useReducedMotion();
  const whatsapp = whatsappUrl(`Hi HonyB, I just sent order request ${reference}.`);

  return (
    <m.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto flex max-w-xl flex-col items-center gap-5 overflow-hidden rounded-[2rem] border border-gold-400/30 bg-forest-900/70 px-8 py-16 text-center"
      role="status"
    >
      {!reduceMotion
        ? Array.from({ length: 10 }, (_, i) => (
            <m.span
              key={i}
              aria-hidden="true"
              className="absolute top-0 h-5 w-3.5 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-linear-to-b from-gold-300 to-gold-600"
              style={{ left: `${8 + i * 9}%` }}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: [-30, 420], opacity: [0, 1, 0] }}
              transition={{ duration: 1.8, delay: 0.2 + (i % 5) * 0.15 + Math.floor(i / 5) * 0.4, ease: "easeIn" }}
            />
          ))
        : null}
      <div className="h-36 w-28">
        <HoneyJar fill={1} className="size-full" />
      </div>
      <h2 className="font-display text-4xl text-cream-50">Thank you!</h2>
      <p className="text-lg text-cream-300">
        Your order request{" "}
        <strong className="text-gold-300" data-testid="order-reference">
          {reference}
        </strong>{" "}
        is with our team. We&apos;ll call or WhatsApp you shortly to confirm delivery and payment.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" variant="secondary">
          Back to the hive
        </ButtonLink>
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center rounded-full px-6 text-sm text-gold-300 hover:underline"
          >
            Message us on WhatsApp
          </a>
        ) : null}
      </div>
    </m.div>
  );
}
