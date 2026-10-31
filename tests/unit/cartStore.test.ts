import { beforeEach, describe, expect, it } from "vitest";

import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "@/constants/catalog";
import { calculateSubtotal, countJars, toCartLines, useCartStore } from "@/features/cart/store/cartStore";

const store = () => useCartStore.getState();

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds a new line and merges repeat adds", () => {
    expect(store().addItem("sidr-honey", "1kg")).toBe("added");
    expect(store().addItem("sidr-honey", "1kg")).toBe("added");
    expect(store().items).toEqual([{ varietySlug: "sidr-honey", sizeId: "1kg", quantity: 2 }]);
  });

  it("rejects products that are not in the catalogue", () => {
    expect(store().addItem("manuka-honey", "1kg")).toBe("unknown-product");
    expect(store().items).toHaveLength(0);
  });

  it("caps quantity per line", () => {
    store().addItem("acacia-honey", "500g", MAX_QUANTITY_PER_LINE);
    expect(store().addItem("acacia-honey", "500g")).toBe("limit-reached");
    store().setQuantity("acacia-honey", "500g", 999);
    expect(store().items[0].quantity).toBe(MAX_QUANTITY_PER_LINE);
    store().setQuantity("acacia-honey", "500g", 0);
    expect(store().items[0].quantity).toBe(1);
  });

  it("caps the number of different lines", () => {
    const lines = Array.from({ length: MAX_CART_LINES }, (_, i) => ({
      varietySlug: "sidr-honey",
      sizeId: "1kg" as const,
      quantity: i + 1,
    }));
    useCartStore.setState({ items: lines });
    expect(store().addItem("wildflower-honey", "2kg")).toBe("limit-reached");
  });

  it("removes lines and clears", () => {
    store().addItem("sidr-honey", "1kg");
    store().addItem("wildflower-honey", "2kg");
    store().removeItem("sidr-honey", "1kg");
    expect(store().items.map((i) => i.varietySlug)).toEqual(["wildflower-honey"]);
    store().clear();
    expect(store().items).toEqual([]);
  });

  it("derives lines, totals and jar count from catalogue prices", () => {
    store().addItem("sidr-honey", "1kg", 2); // 2 × 6,000
    store().addItem("acacia-honey", "500g"); // 1 × 1,900
    const lines = toCartLines(store().items);
    expect(lines.map((l) => l.lineTotal)).toEqual([12000, 1900]);
    expect(calculateSubtotal(lines)).toBe(13900);
    expect(countJars(store().items)).toBe(3);
  });
});
