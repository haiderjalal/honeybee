"use client";

import { m, type PanInfo } from "motion/react";
import { Check, Plus } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { HoneyJar } from "@/components/art/HoneyJar";
import { Button } from "@/components/ui/Button";
import { isPointOverDropZone } from "@/features/cart/dropZone";
import { useCartUiStore } from "@/features/cart/store/cartUiStore";
import { useAddToCart } from "@/features/cart/useAddToCart";
import { formatPkr } from "@/utils/formatPkr";

import type { HoneyVariety, JarSize } from "@/types/catalog";

interface DraggableJarProps {
  size: JarSize;
  variety: HoneyVariety | null;
  ready: boolean;
  registerJar: (element: HTMLElement | null) => void;
}

// Jars start empty and lidless; HoneyLab animates these variables during the harvest.
const EMPTY_JAR = { "--fill": 0, "--lid": 0 } as CSSProperties;

/** PanInfo.point is page-relative; the drop zone is viewport-relative. */
const toClient = (info: PanInfo) => ({ x: info.point.x - window.scrollX, y: info.point.y - window.scrollY });

export function DraggableJar({ size, variety, ready, registerJar }: DraggableJarProps) {
  const addToCart = useAddToCart();
  const setDragging = useCartUiStore((state) => state.setDragging);
  const setOverDropZone = useCartUiStore((state) => state.setOverDropZone);
  const [justAdded, setJustAdded] = useState(false);

  // Clears the "added" confirmation after a moment; the timer is cancelled on unmount and on re-add.
  const resetTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const add = () => {
    if (!variety) return;
    if (addToCart(variety.slug, size.id) === "added") {
      setJustAdded(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setJustAdded(false), 1400);
    }
  };

  const name = variety ? `${variety.name} ${size.label}` : size.label;

  return (
    <li className="flex flex-col items-center gap-3">
      <m.div
        drag={ready}
        dragSnapToOrigin
        dragElastic={0.4}
        dragMomentum={false}
        whileHover={ready ? { y: -6 } : undefined}
        whileDrag={{ scale: 1.12, rotate: -7, zIndex: 60, filter: "drop-shadow(0 30px 40px rgb(0 0 0 / 0.6))" }}
        onDragStart={() => setDragging(true)}
        onDrag={(_, info) => {
          const point = toClient(info);
          setOverDropZone(isPointOverDropZone(point.x, point.y));
        }}
        onDragEnd={(_, info) => {
          const point = toClient(info);
          const dropped = isPointOverDropZone(point.x, point.y);
          setDragging(false);
          if (dropped) add();
        }}
        className={ready ? "relative cursor-grab touch-none select-none active:cursor-grabbing" : "relative"}
        data-testid={`lab-jar-${size.id}`}
        aria-hidden="true"
        style={{ width: `${size.scale * 100}%` }}
      >
        <div ref={registerJar} style={EMPTY_JAR}>
          <HoneyJar
            className="w-full"
            label={{ title: size.label, subtitle: variety ? formatPkr(variety.prices[size.id]) : "Empty" }}
          />
        </div>
      </m.div>

      <p className="text-center text-sm text-cream-300">
        <span className="font-display text-lg text-cream-50 sm:text-xl">{size.label}</span>
        {variety ? (
          <span className="block tabular-nums sm:inline sm:before:content-['_·_']">
            {formatPkr(variety.prices[size.id])}
          </span>
        ) : null}
      </p>
      <Button
        size="sm"
        variant={ready ? "primary" : "secondary"}
        disabled={!ready}
        onClick={add}
        aria-label={ready ? `Add ${name} to your hive` : `Harvest a honeycomb first to fill the ${size.label} jar`}
        className="w-full max-w-40 px-3"
      >
        {justAdded ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        <span className="hidden sm:inline">{justAdded ? "Added" : "Add to hive"}</span>
        <span className="sm:hidden">{justAdded ? "Added" : "Add"}</span>
      </Button>
    </li>
  );
}
