import { describe, expect, it } from "vitest";

import {
  cleanHoneycombName,
  fitHoneycombName,
  formatHoneycombName,
  hexagonPoints,
  HONEYCOMB_NAME_MAX_LENGTH,
  layoutHoneycomb,
} from "@/features/honeycomb/honeycombLayout";

describe("layoutHoneycomb", () => {
  it("lays cells out in rows that alternate in offset, like a real comb", () => {
    const layout = layoutHoneycomb(8, 6);
    const first = layout.cells[0];
    const sixth = layout.cells[5];
    const seventh = layout.cells[6];

    expect(seventh.cy).toBeGreaterThan(first.cy);
    expect(seventh.cx).toBeGreaterThan(first.cx);
    expect(sixth.cy).toBe(first.cy);
  });

  it("grows taller as more cells are added, and never collapses to nothing", () => {
    const small = layoutHoneycomb(3);
    const big = layoutHoneycomb(30);

    expect(big.height).toBeGreaterThan(small.height);
    expect(layoutHoneycomb(0).cells).toEqual([]);
    expect(layoutHoneycomb(0).height).toBeGreaterThan(0);
  });

  it("keeps every cell inside the drawing area", () => {
    const layout = layoutHoneycomb(14);
    for (const cell of layout.cells) {
      expect(cell.cx).toBeGreaterThan(0);
      expect(cell.cx).toBeLessThan(layout.width);
      expect(cell.cy).toBeGreaterThan(0);
      expect(cell.cy).toBeLessThan(layout.height);
    }
  });
});

describe("hexagonPoints", () => {
  it("draws six corners around the centre", () => {
    expect(hexagonPoints(100, 100).split(" ")).toHaveLength(6);
  });
});

describe("formatHoneycombName", () => {
  it("shows the first name and the initial of the last name", () => {
    expect(formatHoneycombName("Saba Anjum Babar")).toBe("Saba B.");
    expect(formatHoneycombName("Abdul Rahman")).toBe("Abdul R.");
  });

  it("shows a single name as it is", () => {
    expect(formatHoneycombName("Faizan")).toBe("Faizan");
  });

  it("copes with extra spaces and an empty name", () => {
    expect(formatHoneycombName("  Faizan   Khan  ")).toBe("Faizan K.");
    expect(formatHoneycombName("   ")).toBe("Member");
  });
});

describe("fitHoneycombName", () => {
  it("leaves short names alone and shortens long ones", () => {
    expect(fitHoneycombName("Faizan")).toBe("Faizan");
    expect(fitHoneycombName("Maryam Shehzadi")).toBe("Maryam Sh…");
  });
});

describe("cleanHoneycombName", () => {
  it("treats a blank name as no choice", () => {
    expect(cleanHoneycombName("")).toEqual({ ok: true, value: null });
    expect(cleanHoneycombName("   ")).toEqual({ ok: true, value: null });
  });

  it("trims the name and collapses extra spaces", () => {
    expect(cleanHoneycombName("  Faizan    A.  ")).toEqual({ ok: true, value: "Faizan A." });
  });

  it("accepts letters, dots, hyphens and apostrophes", () => {
    expect(cleanHoneycombName("Mary-Jane O'Neil")).toEqual({ ok: true, value: "Mary-Jane O'Neil" });
    expect(cleanHoneycombName("Zoë K.")).toEqual({ ok: true, value: "Zoë K." });
  });

  it("refuses digits and markup", () => {
    expect(cleanHoneycombName("Faizan 2")).toMatchObject({ ok: false });
    expect(cleanHoneycombName("<b>Faizan</b>")).toMatchObject({ ok: false });
  });

  it("allows up to the maximum length and no more", () => {
    expect(cleanHoneycombName("A".repeat(HONEYCOMB_NAME_MAX_LENGTH))).toEqual({
      ok: true,
      value: "A".repeat(HONEYCOMB_NAME_MAX_LENGTH),
    });
    expect(cleanHoneycombName("A".repeat(HONEYCOMB_NAME_MAX_LENGTH + 1))).toMatchObject({ ok: false });
  });
});
