"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

import { loadDragFeatures } from "./motionFeatures";

/** Enables drag gestures for the honey lab only, on top of the animation features the app already loads. */
export function DragMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadDragFeatures} strict>
      {children}
    </LazyMotion>
  );
}
