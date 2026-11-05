import { describe, expect, it } from "vitest";

import { DELIVERY_CITIES } from "@/constants/delivery";
import { ROUTES } from "@/constants/routes";
import { GUIDE_FAQ, GUIDE_SECTIONS } from "@/features/guide/originalHoneyGuide";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/lib/seo/llmsText";

describe("llms.txt", () => {
  it("names the delivery towns and links the buying guide", () => {
    const text = buildLlmsTxt();

    for (const town of ["Islamabad", "Rawalpindi", "Peshawar", "Swat", "Malakand", "Batkhela", "Chakdara", "Thana"]) {
      expect(text).toContain(town);
    }
    expect(text).toContain(ROUTES.guide);
  });

  it("lists only Pakistani places for delivery", () => {
    expect(DELIVERY_CITIES).not.toContain("Kabul");
    expect(buildLlmsTxt()).not.toContain("Kabul");
    expect(buildLlmsFullTxt()).not.toContain("Kabul");
  });

  it("includes the whole buying guide in llms-full.txt", () => {
    const text = buildLlmsFullTxt();

    for (const section of GUIDE_SECTIONS) {
      expect(text).toContain(`### ${section.heading}`);
    }
    expect(text).toContain(GUIDE_FAQ[0].question);
  });
});

describe("buying guide", () => {
  it("asks each question once and gives every section some text", () => {
    const questions = GUIDE_FAQ.map((item) => item.question);

    expect(new Set(questions).size).toBe(questions.length);
    for (const section of GUIDE_SECTIONS) {
      expect(section.paragraphs.length).toBeGreaterThan(0);
    }
  });
});
