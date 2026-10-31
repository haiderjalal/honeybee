export interface Point {
  x: number;
  y: number;
}

export interface HexCell extends Point {
  q: number;
  r: number;
  /** Hex distance from the centre cell. */
  ring: number;
}

const SQRT3 = Math.sqrt(3);

/** Corner points of a pointy-top hexagon. */
export function hexCorners(cx: number, cy: number, radius: number): Point[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90);
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

export function hexPointsAttr(cx: number, cy: number, radius: number): string {
  return hexCorners(cx, cy, radius)
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
}

/** Pointy-top axial coordinates to pixels. */
export function axialToPixel(q: number, r: number, radius: number): Point {
  return { x: radius * SQRT3 * (q + r / 2), y: radius * 1.5 * r };
}

/** A hexagon-shaped honeycomb with `rings` rings around a centre cell (rings=3 → 37 cells). */
export function createHexGrid(rings: number, radius: number, origin: Point): HexCell[] {
  const cells: HexCell[] = [];
  for (let q = -rings; q <= rings; q++) {
    const rMin = Math.max(-rings, -q - rings);
    const rMax = Math.min(rings, -q + rings);
    for (let r = rMin; r <= rMax; r++) {
      const p = axialToPixel(q, r, radius);
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      cells.push({ q, r, ring, x: origin.x + p.x, y: origin.y + p.y });
    }
  }
  return cells;
}

export function hexCellCount(rings: number): number {
  return 3 * rings * (rings + 1) + 1;
}
