"use client";

import { LazyMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { BeeCursor } from "@/components/shared/BeeCursor";
import { useCartStore } from "@/features/cart/store/cartStore";

import { SmoothScroll } from "./SmoothScroll";
import { loadAnimationFeatures } from "./motionFeatures";

// Animation features are code-split and loaded after first paint; drag features load only in the lab.
export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return (
    <LazyMotion features={loadAnimationFeatures} strict>
      <SmoothScroll />
      <BeeCursor />
      {children}
    </LazyMotion>
  );
}
