"use client";

import { AnimatePresence, m, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { hexPointsAttr } from "@/utils/hex";

import { registerDropZone } from "../dropZone";
import { countJars, useCartStore } from "../store/cartStore";
import { useCartUiStore } from "../store/cartUiStore";

/** Floating hexagonal "hive" — the cart button and the drop target for dragged jars. */
export function CartHive() {
  const count = useCartStore((state) => countJars(state.items));
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const isDragging = useCartUiStore((state) => state.isDragging);
  const isOver = useCartUiStore((state) => state.isOverDropZone);
  const addPulse = useCartUiStore((state) => state.addPulse);
  const openDrawer = useCartUiStore((state) => state.openDrawer);
  const reduceMotion = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const elementRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    registerDropZone(elementRef.current);
    return () => registerDropZone(null);
  }, []);

  useEffect(() => {
    if (addPulse === 0 || reduceMotion || !scope.current) return;
    animate(scope.current, { scale: [1, 1.28, 0.92, 1.06, 1], rotate: [0, -8, 6, -2, 0] }, { duration: 0.7 });
  }, [addPulse, animate, reduceMotion, scope]);

  const label =
    hasHydrated && count > 0 ? `Open your hive, ${count} ${count === 1 ? "jar" : "jars"}` : "Open your hive (cart)";

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {isDragging ? (
          <m.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 bottom-full mb-3 rounded-full bg-gold-400 px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-forest-950 shadow-lg"
            aria-hidden="true"
          >
            {isOver ? "Release to add" : "Drop the jar here"}
          </m.p>
        ) : null}
      </AnimatePresence>

      <m.button
        ref={elementRef}
        type="button"
        onClick={openDrawer}
        aria-label={label}
        data-testid="cart-hive"
        animate={{ scale: isOver ? 1.45 : isDragging ? 1.25 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="pointer-events-auto relative grid size-16 place-items-center rounded-full focus-visible:outline-offset-4 sm:size-24"
      >
        <span ref={scope} className="absolute inset-0 grid place-items-center">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full drop-shadow-[0_12px_30px_rgb(224_154_18/0.55)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hive-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe6a6" />
                <stop offset="55%" stopColor="#f6bd3c" />
                <stop offset="100%" stopColor="#b8770a" />
              </linearGradient>
            </defs>
            <polygon points={hexPointsAttr(50, 50, 46)} fill="url(#hive-fill)" stroke="#6b3a06" strokeWidth="2.5" />
            <polygon
              points={hexPointsAttr(50, 50, 36)}
              fill="none"
              stroke="#6b3a06"
              strokeOpacity="0.3"
              strokeWidth="2"
            />
            {isDragging ? (
              <polygon
                points={hexPointsAttr(50, 50, 49)}
                fill="none"
                stroke="#fff3cf"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="honey-flow"
              />
            ) : null}
          </svg>
          <svg viewBox="0 0 24 24" className="relative size-8 text-forest-950" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7 7V6a5 5 0 0 1 10 0v1h2.2a1 1 0 0 1 1 .92l.9 12A1 1 0 0 1 20.1 21H3.9a1 1 0 0 1-1-1.08l.9-12A1 1 0 0 1 4.8 7H7Zm2 0h6V6a3 3 0 0 0-6 0v1Z"
            />
          </svg>
        </span>
        {hasHydrated && count > 0 ? (
          <span className="absolute -top-1 -right-1 grid min-w-7 place-items-center rounded-full border-2 border-forest-950 bg-cream-50 px-1.5 text-sm font-bold text-forest-950 tabular-nums">
            {count}
          </span>
        ) : null}
      </m.button>
    </div>
  );
}
