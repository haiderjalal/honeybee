/**
 * Tracks the hive (cart) element so draggable jars can hit-test against it
 * without coupling the jar components to the cart's DOM.
 */
let dropZoneElement: HTMLElement | null = null;

/** Extra forgiveness around the hive so drops feel generous on touch screens. */
const HIT_SLOP = 36;

export function registerDropZone(element: HTMLElement | null): void {
  dropZoneElement = element;
}

export function isPointOverDropZone(clientX: number, clientY: number): boolean {
  if (!dropZoneElement) return false;
  const rect = dropZoneElement.getBoundingClientRect();
  return (
    clientX >= rect.left - HIT_SLOP &&
    clientX <= rect.right + HIT_SLOP &&
    clientY >= rect.top - HIT_SLOP &&
    clientY <= rect.bottom + HIT_SLOP
  );
}
