"use client";

import { LazyMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { BeeCursor } from "@/components/shared/BeeCursor";
import { useCartStore } from "@/features/cart/store/cartStore";

import { SmoothScroll } from "./SmoothScroll";

// domMax (drag + layout) is code-split and loaded after first paint.
const loadMotionFeatures = () => import("./motionFeatures").then((mod) => mod.default);

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <SmoothScroll />
      <BeeCursor />
      {children}
    </LazyMotion>
  );
}
