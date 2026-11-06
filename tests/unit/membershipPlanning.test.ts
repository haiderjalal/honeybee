import { describe, expect, it } from "vitest";

import { normalizePakistaniMobile } from "@/utils/phone";
import { planRenewalReminder } from "@/services/membership/membershipReminders";

const DAY_MS = 24 * 60 * 60 * 1000;
const expiresAt = new Date("2027-11-06T10:00:00Z");
const term = { id: "term-1", status: "active" as const, expiresAt };

describe("normalizePakistaniMobile", () => {
  it("accepts the common written forms and returns the 03 form", () => {
    expect(normalizePakistaniMobile("0300 1234567")).toBe("03001234567");
    expect(normalizePakistaniMobile("0300-123-4567")).toBe("03001234567");
    expect(normalizePakistaniMobile("+92 300 1234567")).toBe("03001234567");
    expect(normalizePakistaniMobile("00923001234567")).toBe("03001234567");
  });

  it("rejects numbers that are not Pakistani mobiles", () => {
    expect(normalizePakistaniMobile("021 1234567")).toBeNull();
    expect(normalizePakistaniMobile("0300 123")).toBeNull();
    expect(normalizePakistaniMobile("hello")).toBeNull();
  });
});

describe("planRenewalReminder", () => {
  it("plans nothing without consent", () => {
    expect(
      planRenewalReminder({ term, now: new Date(expiresAt.getTime() - 3 * DAY_MS), renewalRemindersEnabled: false }),
    ).toBeNull();
  });

  it("plans nothing for a term that is not active", () => {
    expect(
      planRenewalReminder({
        term: { ...term, status: "suspended" },
        now: new Date(expiresAt.getTime() - 3 * DAY_MS),
        renewalRemindersEnabled: true,
      }),
    ).toBeNull();
  });

  it("plans nothing more than 30 days before expiry", () => {
    expect(
      planRenewalReminder({ term, now: new Date(expiresAt.getTime() - 31 * DAY_MS), renewalRemindersEnabled: true }),
    ).toBeNull();
  });

  it("plans the 30-day reminder inside the 30-day window", () => {
    expect(
      planRenewalReminder({ term, now: new Date(expiresAt.getTime() - 20 * DAY_MS), renewalRemindersEnabled: true }),
    ).toEqual({ kind: "renewal_30_days", dedupeKey: "renewal_30_days:term-1" });
  });

  it("plans only the 7-day reminder once inside the 7-day window", () => {
    expect(
      planRenewalReminder({ term, now: new Date(expiresAt.getTime() - 7 * DAY_MS), renewalRemindersEnabled: true }),
    ).toEqual({ kind: "renewal_7_days", dedupeKey: "renewal_7_days:term-1" });
  });

  it("plans nothing at or after expiry", () => {
    expect(planRenewalReminder({ term, now: expiresAt, renewalRemindersEnabled: true })).toBeNull();
  });
});
