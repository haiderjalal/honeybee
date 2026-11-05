import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SizePrice } from "@/features/catalog/SizePrice";
import { getVarietyBySlug } from "@/services/catalog.service";

describe("SizePrice", () => {
  it("shows the original price struck through before the sale price", () => {
    const sidr = getVarietyBySlug("sidr-honey");
    if (!sidr) throw new Error("Sidr honey is missing from the catalogue");

    const { container } = render(<SizePrice variety={sidr} sizeId="1kg" />);

    expect(container.querySelector("s")?.textContent).toContain("Rs 3,999");
    expect(container.textContent).toContain("Rs 3,699");
  });

  it("shows only the sale price when the jar is not on offer", () => {
    const sidr = getVarietyBySlug("sidr-honey");
    if (!sidr) throw new Error("Sidr honey is missing from the catalogue");

    const { container } = render(<SizePrice variety={sidr} sizeId="500g" />);

    expect(container.querySelector("s")).toBeNull();
    expect(container.textContent).toBe(`Rs 1,970`);
  });
});
