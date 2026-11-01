import { describe, expect, it } from "vitest";

import { getDiscoverSlug, getVarieties, getVarietyByDiscoverSlug } from "@/services/catalog.service";

describe("discover slugs", () => {
  it.each([
    ["sidr-honey", "sidr"],
    ["acacia-honey", "acacia"],
    ["wildflower-honey", "wildflower"],
  ])("shortens %s to %s", (slug, discoverSlug) => {
    const variety = getVarieties().find((item) => item.slug === slug);
    expect(variety && getDiscoverSlug(variety)).toBe(discoverSlug);
  });

  it("gives every variety a unique discover page", () => {
    const slugs = getVarieties().map(getDiscoverSlug);
    expect(new Set(slugs).size).toBe(getVarieties().length);
  });

  it("resolves a variety from its discover slug and rejects unknown ones", () => {
    expect(getVarietyByDiscoverSlug("acacia")?.slug).toBe("acacia-honey");
    expect(getVarietyByDiscoverSlug("manuka")).toBeNull();
    expect(getVarietyByDiscoverSlug("sidr-honey")).toBeNull();
  });
});
