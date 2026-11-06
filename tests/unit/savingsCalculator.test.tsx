import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SavingsCalculator, type CalculatorVariety } from "@/features/membership/components/SavingsCalculator";
import { getVarieties } from "@/services/catalog.service";

const varieties: CalculatorVariety[] = getVarieties().map((variety) => ({
  slug: variety.slug,
  name: variety.name,
  prices: variety.prices,
  listPrices: variety.listPrices,
}));

const choose = (id: string, value: string) =>
  fireEvent.change(document.getElementById(id) as HTMLElement, { target: { value } });

describe("SavingsCalculator", () => {
  // Vitest globals are off, so Testing Library cannot clean up between tests on its own.
  afterEach(cleanup);

  it("explains that a jar on sale is not eligible for the membership discount", () => {
    render(<SavingsCalculator varieties={varieties} />);

    // The default selection is Sidr 1 kg, which is on sale.
    expect(screen.getByTestId("calc-outcome").textContent).toContain("This jar is on sale");
    expect(screen.queryByTestId("calc-saving")).toBeNull();
  });

  it("shows the saving and the fee-recovery count at current prices", () => {
    render(<SavingsCalculator varieties={varieties} />);

    choose("calc-variety", "wildflower-honey");
    choose("calc-size", "2kg");

    // 2 kg Wildflower is Rs 5,400, so 10% is Rs 540, capped at Rs 350 per order.
    expect(screen.getByTestId("calc-saving").textContent).toBe("Rs 350");
    // Rs 999 divided by a Rs 350 saving rounds up to three orders.
    expect(screen.getByText(/3 orders like this recover the Rs 999 fee/)).toBeTruthy();
  });

  it("tells the customer how much more honey is needed below the minimum", () => {
    render(<SavingsCalculator varieties={varieties} />);

    choose("calc-variety", "wildflower-honey");
    choose("calc-size", "1kg");

    // 1 kg Wildflower is Rs 2,800, which is Rs 200 short of the Rs 3,000 minimum.
    expect(screen.getByTestId("calc-outcome").textContent).toContain("Rs 200");
  });

  it("scales the basket with quantity and never accepts more than the per-line maximum", () => {
    render(<SavingsCalculator varieties={varieties} />);

    choose("calc-variety", "wildflower-honey");
    choose("calc-size", "500g");
    fireEvent.change(document.getElementById("calc-quantity") as HTMLElement, { target: { value: "99" } });

    // 500 g Wildflower is Rs 1,500; the quantity is capped at 20, so the basket is Rs 30,000.
    expect(screen.getByText("Rs 30,000").tagName).toBe("STRONG");
    expect((document.getElementById("calc-quantity") as HTMLInputElement).value).toBe("20");
  });
});
