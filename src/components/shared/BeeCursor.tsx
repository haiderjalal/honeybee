"use client";

import { useEffect, useRef } from "react";

/** Elements that should make the B grow, because they respond to a click or drag. */
const INTERACTIVE = "a, button, summary, label, select, [role='button'], .cursor-grab";
/** Text entry keeps the native I-beam so typing feels normal. */
const TEXT_ENTRY =
  "input:not([type='checkbox']):not([type='radio']):not([type='range']), textarea, [contenteditable='true']";
/** Share of the remaining distance covered per frame; lower values trail the pointer more. */
const FOLLOW_EASE = 0.35;
const SETTLED_PX = 0.1;

/**
 * Replaces the system pointer with a small gold "B" that trails the cursor.
 * Only enabled for fine pointers (mouse, trackpad, pen); touch screens keep their normal behaviour.
 * The B is decorative, so it is hidden from assistive technology.
 */
export function BeeCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !window.matchMedia("(pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("has-bee-cursor");

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;

    const follow = () => {
      x += (targetX - x) * FOLLOW_EASE;
      y += (targetY - y) * FOLLOW_EASE;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < SETTLED_PX;
      frame = settled ? 0 : requestAnimationFrame(follow);
    };

    const onMove = (event: PointerEvent) => {
      // Snap on the first move so the B doesn't glide in from the corner.
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
      <span className="bee-cursor-glyph">B</span>
    </div>
  );
}
