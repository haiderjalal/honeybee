/**
 * Geometry for the honeycomb wall. Cells are pointy-topped hexagons in rows that alternate in offset, so they fit
 * together without gaps. The wall grows downwards as cells are added.
 */

export const HONEYCOMB_COLUMNS = 6;

/** Hexagon radius in SVG units: the distance from the centre to a corner. */
export const HEX_RADIUS = 40;

const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const ROW_HEIGHT = HEX_RADIUS * 1.5;

export interface HexCell {
  index: number;
  cx: number;
  cy: number;
}

export interface HoneycombLayout {
  cells: HexCell[];
  width: number;
  height: number;
}

/** Places `count` cells in rows of `columns`. Odd rows shift half a cell to the right, as in a real comb. */
export function layoutHoneycomb(count: number, columns: number = HONEYCOMB_COLUMNS): HoneycombLayout {
  const cells = Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const offset = row % 2 === 1 ? HEX_WIDTH / 2 : 0;
    return {
      index,
      cx: HEX_WIDTH / 2 + col * HEX_WIDTH + offset,
      cy: HEX_RADIUS + row * ROW_HEIGHT,
    };
  });

  const rows = Math.max(1, Math.ceil(count / columns));
  return {
    cells,
    width: columns * HEX_WIDTH + HEX_WIDTH / 2,
    height: HEX_RADIUS * 2 + (rows - 1) * ROW_HEIGHT,
  };
}

/** The six corners of a pointy-topped hexagon centred on (cx, cy), as an SVG points attribute. */
export function hexagonPoints(cx: number, cy: number): string {
  const halfWidth = HEX_WIDTH / 2;
  const halfRadius = HEX_RADIUS / 2;
  return [
    [cx, cy - HEX_RADIUS],
    [cx + halfWidth, cy - halfRadius],
    [cx + halfWidth, cy + halfRadius],
    [cx, cy + HEX_RADIUS],
    [cx - halfWidth, cy + halfRadius],
    [cx - halfWidth, cy - halfRadius],
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

/**
 * Shows a customer as their first name and the initial of their last name, for example "Saba Anjum Babar" becomes
 * "Saba B.". A single name is shown as it is. The full name is not shown publicly.
 */
export function formatHoneycombName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Member";
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${parts[0]} ${lastInitial}.`;
}

/** Shortens a name to fit inside a cell. */
export function fitHoneycombName(name: string, maxLength = 10): string {
  return name.length <= maxLength ? name : `${name.slice(0, maxLength - 1)}…`;
}
