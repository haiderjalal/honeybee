"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { ROUTES, SECTION_IDS } from "@/constants/routes";
import { formatPkr } from "@/utils/formatPkr";

import { calculateSubtotal, toCartLines, useCartStore } from "../store/cartStore";
import { useCartUiStore } from "../store/cartUiStore";
import { CartLineItem } from "./CartLineItem";

/** Slide-in cart built on the native <dialog> for focus trapping, Esc to close and inert background. */
export function CartDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = useCartUiStore((state) => state.isDrawerOpen);
  const closeDrawer = useCartUiStore((state) => state.closeDrawer);
  const items = useCartStore((state) => state.items);
  const lines = useMemo(() => toCartLines(items), [items]);
  const subtotal = calculateSubtotal(lines);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={closeDrawer}
      onClick={(event) => {
        // Clicking the backdrop (the dialog element itself) closes the drawer.
        if (event.target === event.currentTarget) closeDrawer();
      }}
      aria-labelledby="cart-title"
      className="cart-drawer m-0 ms-auto h-dvh max-h-dvh w-full max-w-md border-l border-gold-400/20 bg-forest-900 p-0 text-cream-100 shadow-2xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-cream-500/15 px-6 py-5">
          <h2 id="cart-title" className="font-display text-2xl text-cream-50">
            Your hive
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close your hive"
            className="grid size-10 place-items-center rounded-full text-cream-300 transition-colors hover:bg-cream-50/5 hover:text-gold-300"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-display text-2xl text-cream-50">Your hive is empty</p>
            <p className="text-cream-300">Visit the Honey Lab, harvest a comb and drop a jar in here.</p>
            <ButtonLink href={`/#${SECTION_IDS.lab}`} onClick={closeDrawer} variant="secondary">
              Go to the Honey Lab
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul
              className="flex-1 divide-y divide-cream-500/15 overflow-y-auto overscroll-contain px-6"
              data-lenis-prevent
            >
              {lines.map((line) => (
                <CartLineItem key={`${line.varietySlug}:${line.sizeId}`} line={line} />
              ))}
            </ul>
            <footer className="space-y-4 border-t border-cream-500/15 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-cream-300">Subtotal</span>
                <span className="font-display text-2xl text-cream-50 tabular-nums" data-testid="drawer-subtotal">
                  {formatPkr(subtotal)}
                </span>
              </div>
              <p className="text-xs text-cream-500">
                Delivery is confirmed when we call you. Nothing is charged online.
              </p>
              <ButtonLink href={ROUTES.checkout} onClick={closeDrawer} size="lg" className="w-full">
                Send order request
              </ButtonLink>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}
