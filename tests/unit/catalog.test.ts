import { describe, expect, it } from "vitest";

import { HONEY_VARIETIES, JAR_SIZES } from "@/constants/catalog";
import { getPricedVariant, getStartingPrice, getVarietyBySlug } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";

describe("catalog", () => {
  it("offers three varieties in 500 g, 1 kg and 2 kg", () => {
    expect(HONEY_VARIETIES.map((v) => v.slug)).toEqual(["sidr-honey", "acacia-honey", "wildflower-honey"]);
    expect(JAR_SIZES.map((s) => s.id)).toEqual(["500g", "1kg", "2kg"]);
  });

  it("prices every variety in every size, increasing with weight", () => {
    for (const variety of HONEY_VARIETIES) {
      const prices = JAR_SIZES.map((size) => variety.prices[size.id]);
      expect(prices.every((price) => Number.isInteger(price) && price > 0)).toBe(true);
      expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    }
  });

  it("has unique slugs", () => {
    expect(new Set(HONEY_VARIETIES.map((v) => v.slug)).size).toBe(HONEY_VARIETIES.length);
  });

  it("resolves priced variants and rejects unknown ones", () => {
    expect(getPricedVariant("sidr-honey", "1kg")?.unitPrice).toBe(6000);
    expect(getPricedVariant("sidr-honey", "5kg")).toBeNull();
    expect(getPricedVariant("manuka", "1kg")).toBeNull();
    expect(getVarietyBySlug("nope")).toBeNull();
  });

  it("returns the lowest price as the starting price", () => {
    const acacia = getVarietyBySlug("acacia-honey");
    expect(acacia && getStartingPrice(acacia)).toBe(1900);
  });
});

describe("formatPkr", () => {
  it("formats whole rupees with grouping", () => {
    expect(formatPkr(6000)).toBe("Rs 6,000");
    expect(formatPkr(11500)).toBe("Rs 11,500");
    expect(formatPkr(0)).toBe("Rs 0");
  });

  it("rounds fractional amounts", () => {
    expect(formatPkr(1499.6)).toBe("Rs 1,500");
  });
});
