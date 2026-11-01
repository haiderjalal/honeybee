import { afterEach, describe, expect, it, vi } from "vitest";

import { createIdempotencyKey } from "@/features/inquiry/useInquirySubmit";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createIdempotencyKey", () => {
  it("creates a version 4 UUID", () => {
    expect(createIdempotencyKey()).toMatch(UUID_V4);
  });

  it("falls back to getRandomValues when randomUUID is unavailable (plain-HTTP pages)", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: <T extends ArrayBufferView>(array: T): T => {
        new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(0xab);
        return array;
      },
    });

    expect(createIdempotencyKey()).toMatch(UUID_V4);
  });
});
