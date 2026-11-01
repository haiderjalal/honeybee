import { expect, test } from "@playwright/test";

test.describe("SEO and GEO", () => {
  test("serves robots.txt, sitemap.xml, llms.txt and the manifest", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    const robotsText = await robots.text();
    expect(robotsText).toContain("Sitemap:");
    expect(robotsText).toContain("GPTBot");
    expect(robotsText).toContain("Disallow: /api/");

    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("/honey/sidr-honey");

    const llms = await request.get("/llms.txt");
    expect(llms.headers()["content-type"]).toContain("text/plain");
    expect(await llms.text()).toMatch(/^# HonyB/);

    expect((await request.get("/llms-full.txt")).ok()).toBe(true);
    expect((await request.get("/manifest.webmanifest")).ok()).toBe(true);
  });

  test("favicon and Apple touch icon are served and linked", async ({ page, request }) => {
    for (const path of ["/icon.png", "/apple-icon.png"]) {
      const response = await request.get(path);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/png");
    }

    await page.goto("/");
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon\.png/);
    await expect(page.locator('link[rel="apple-touch-icon"]').first()).toHaveAttribute("href", /apple-icon\.png/);
  });

  test("home page has one h1, metadata and structured data", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/HonyB/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\/[^/]+\/?$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    const types = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(types.join()).toContain('"FAQPage"');
    expect(types.join()).toContain('"Organization"');
  });

  test("product pages expose Product offers in PKR", async ({ page }) => {
    await page.goto("/honey/sidr-honey");
    await expect(page.getByRole("heading", { level: 1, name: "Sidr Honey" })).toBeVisible();
    const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join();
    expect(jsonLd).toContain('"@type":"Product"');
    expect(jsonLd).toContain('"priceCurrency":"PKR"');
    expect(jsonLd).toContain('"BreadcrumbList"');
  });

  test("unknown honey returns 404", async ({ page }) => {
    const response = await page.goto("/honey/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This bee flew off course" })).toBeVisible();
  });
});
