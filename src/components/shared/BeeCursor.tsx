"use client";

import { useEffect, useRef } from "react";

import { Bee } from "@/components/art/Bee";

/** Elements that should make the bee grow, because they respond to a click or drag. */
const INTERACTIVE = "a, button, summary, label, select, [role='button'], .cursor-grab";
/** Text entry keeps the native I-beam so typing feels normal. */
const TEXT_ENTRY =
  "input:not([type='checkbox']):not([type='radio']):not([type='range']), textarea, [contenteditable='true']";
/** Share of the remaining distance covered per frame; lower values trail the pointer more. */
const FOLLOW_EASE = 0.35;
const SETTLED_PX = 0.1;
/** Smoothing for the bee's turn and tilt, so it banks gently instead of snapping. */
const TURN_EASE = 0.2;
/** Horizontal speed (px per frame) below which the bee keeps the facing it already has. */
const TURN_THRESHOLD = 0.6;
/** Largest tilt, in degrees, when the bee is moving steeply up or down. */
const MAX_TILT = 24;

/**
 * Replaces the system pointer with a small honeybee that trails the cursor and turns to face
 * the way it is moving. Only enabled for fine pointers (mouse, trackpad, pen); touch screens keep
 * their normal behaviour. The bee is decorative, so it is hidden from assistive technology.
 */
export function BeeCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !window.matchMedia("(pointer: fine)").matches) return;

    const turn = cursor.querySelector<HTMLElement>(".bee-cursor-turn");
    const root = document.documentElement;
    root.classList.add("has-bee-cursor");

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let facing = 1;
    let flip = 1;
    let tilt = 0;
    let frame = 0;

    const follow = () => {
      const previousX = x;
      const previousY = y;
      x += (targetX - x) * FOLLOW_EASE;
      y += (targetY - y) * FOLLOW_EASE;

      const dx = x - previousX;
      const dy = y - previousY;
      if (Math.abs(dx) > TURN_THRESHOLD) facing = dx < 0 ? -1 : 1;
      flip += (facing - flip) * TURN_EASE;
      tilt += (Math.max(-MAX_TILT, Math.min(MAX_TILT, dy * 3)) - tilt) * TURN_EASE;

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (turn) turn.style.transform = `rotate(${tilt.toFixed(2)}deg) scaleX(${flip.toFixed(3)})`;

      const settled =
        Math.abs(targetX - x) + Math.abs(targetY - y) < SETTLED_PX &&
        Math.abs(tilt) < 0.1 &&
        Math.abs(flip - facing) < 0.01;
      frame = settled ? 0 : requestAnimationFrame(follow);
    };

    const onMove = (event: PointerEvent) => {
      // Snap on the first move so the bee doesn't fly in from the corner.
      if (cursor.dataset.visible !== "true") {
        x = event.clientX;
        y = event.clientY;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.dataset.visible = "true";
      if (!frame) frame = requestAnimationFrame(follow);
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      cursor.dataset.hover = String(Boolean(target?.closest(INTERACTIVE)));
      cursor.dataset.mode = target?.closest(TEXT_ENTRY) ? "text" : "default";
    };

    const onLeaveWindow = (event: MouseEvent) => {
      if (!event.relatedTarget) cursor.dataset.visible = "false";
    };
    const onPress = () => {
      cursor.dataset.pressed = "true";
    };
    const onRelease = () => {
      delete cursor.dataset.pressed;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onPress);
    window.addEventListener("pointerup", onRelease);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("mouseout", onLeaveWindow);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onPress);
      window.removeEventListener("pointerup", onRelease);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseout", onLeaveWindow);
      cancelAnimationFrame(frame);
      root.classList.remove("has-bee-cursor");
    };
  }, []);

  return (
    <div ref={cursorRef} aria-hidden="true" className="bee-cursor" data-visible="false">
      <span className="bee-cursor-glyph">
        <span className="bee-cursor-turn">
          <Bee className="block h-auto w-full" />
        </span>
      </span>
    </div>
  );
}
