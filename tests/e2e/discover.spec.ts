import { expect, test } from "@playwright/test";

const PAGES = [
  { slug: "sidr", name: "Sidr Honey" },
  { slug: "acacia", name: "Acacia Honey" },
  { slug: "wildflower", name: "Wildflower Honey" },
] as const;

for (const page of PAGES) {
  test(`discover/${page.slug} renders its story and links to the shop`, async ({ page: browserPage }) => {
    const response = await browserPage.goto(`/discover/${page.slug}`);
    expect(response?.status()).toBe(200);
    await expect(browserPage.getByRole("heading", { level: 1, name: page.name })).toBeVisible();
    await expect(browserPage).toHaveTitle(/Discover/);
    await expect(browserPage.getByRole("link", { name: /Shop .* honey/ })).toHaveAttribute(
      "href",
      `/honey/${page.slug}-honey`,
    );
  });
}

test("an unknown discover page is a real 404", async ({ page }) => {
  const response = await page.goto("/discover/manuka");
  expect(response?.status()).toBe(404);
});
