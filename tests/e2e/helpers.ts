import type { Page } from "@playwright/test";

/** Marks the intro as already seen so tests start on the interactive page. */
export async function skipIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("honeybee-intro-seen", "1");
  });
}

/** Each test looks like a different visitor, so the inquiry rate limiter doesn't trip across tests. */
export function uniqueClientIp(): Record<string, string> {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  return { "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` };
}

export async function harvest(page: Page, varietyName: string): Promise<void> {
  await page.getByRole("button", { name: `Harvest ${varietyName}` }).click();
  await page.getByText(`${varietyName} is ready.`).waitFor({ timeout: 15_000 });
}
