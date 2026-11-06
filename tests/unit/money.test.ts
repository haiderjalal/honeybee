import { describe, expect, it } from "vitest";

import { formatPkrMinor } from "@/utils/formatPkr";
import { percentOfMinor, rupeesToMinor } from "@/utils/money";

describe("money helpers", () => {
  it("converts whole-rupee prices to paisa", () => {
    expect(rupeesToMinor(3499)).toBe(349_900);
  });

  it("takes basis-point percentages with half-up rounding", () => {
    expect(percentOfMinor(349_900, 1_000)).toBe(34_990);
    expect(percentOfMinor(300_505, 1_000)).toBe(30_051);
    expect(percentOfMinor(300_504, 1_000)).toBe(30_050);
  });

  it("formats paisa with two decimals only when needed", () => {
    expect(formatPkrMinor(34_990)).toBe("Rs 349.90");
    expect(formatPkrMinor(35_000)).toBe("Rs 350");
    expect(formatPkrMinor(300_000)).toBe("Rs 3,000");
  });
});
