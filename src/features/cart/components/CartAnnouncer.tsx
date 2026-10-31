"use client";

import { useCartUiStore } from "../store/cartUiStore";

/** Polite live region so cart changes made by drag or button are announced to screen readers. */
export function CartAnnouncer() {
  const announcement = useCartUiStore((state) => state.announcement);
  const addPulse = useCartUiStore((state) => state.addPulse);

  return (
    <div className="visually-hidden" aria-live="polite" aria-atomic="true">
      <span key={addPulse}>{announcement}</span>
    </div>
  );
}
