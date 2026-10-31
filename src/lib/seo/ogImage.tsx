import { ImageResponse } from "next/og";

import type { HoneyPalette } from "@/types/catalog";

export const OG_SIZE = { width: 1200, height: 630 } as const;

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

interface OgOptions {
  eyebrow: string;
  title: string;
  subtitle: string;
  palette: HoneyPalette;
}

/** Shared Open Graph artwork: dark hive background, honeycomb cluster and gold type. */
export function renderOgImage({ eyebrow, title, subtitle, palette }: OgOptions): ImageResponse {
  const cells = [
    [0, 0],
    [1, 0],
    [0.5, 0.86],
    [1.5, 0.86],
    [-0.5, 0.86],
    [0, 1.72],
    [1, 1.72],
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "radial-gradient(circle at 80% 20%, #1a4232 0%, #06130e 60%)",
        color: "#fbf5e8",
        padding: 72,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", position: "absolute", right: 120, top: 130, width: 380, height: 380 }}>
        {cells.map(([x, y]) => (
          <div
            key={`${x}-${y}`}
            style={{
              position: "absolute",
              left: 110 + x * 128,
              top: 20 + y * 128,
              width: 120,
              height: 136,
              clipPath: HEX,
              background: `linear-gradient(135deg, ${palette.light}, ${palette.base} 60%, ${palette.deep})`,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 680 }}>
        <div style={{ display: "flex", fontSize: 30, color: "#f6bd3c", letterSpacing: 6, textTransform: "uppercase" }}>
          Honeybee
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{ display: "flex", fontSize: 26, color: "#ffd77a", letterSpacing: 4, textTransform: "uppercase" }}
          >
            {eyebrow}
          </div>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.02, fontWeight: 700 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 30, color: "#d9c59c" }}>{subtitle}</div>
        </div>
      </div>
    </div>,
    OG_SIZE,
  );
}
