import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInquirySubmit } from "@/features/inquiry/useInquirySubmit";

import type { CartItem } from "@/features/cart/store/cartStore";
import type { CustomerInput } from "@/lib/validations/inquiry.schema";

const customer: CustomerInput = {
  name: "Ayesha Khan",
  phone: "03001234567",
  email: "",
  city: "Lahore",
  address: "House 12, Street 4, Model Town",
  referral: "",
  notes: "",
};
const items: CartItem[] = [{ varietySlug: "sidr-honey", sizeId: "1kg", quantity: 1 }];

describe("useInquirySubmit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends one request when submit is called again before the first one settles", async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useInquirySubmit());

    await act(async () => {
      void result.current.submit(customer, items);
      expect(await result.current.submit(customer, items)).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
