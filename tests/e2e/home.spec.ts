import { expect, test } from "@playwright/test";

import { harvest, skipIntro } from "./helpers";

test.describe("intro", () => {
  test("plays on first visit and can be skipped", async ({ page }) => {
    await page.goto("/");
    const overlay = page.getByTestId("intro-overlay");
    await expect(overlay).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-intro", "playing");

    await page.getByRole("button", { name: "Skip intro" }).click();
    await expect(overlay).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute("data-intro", "done");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("finishes on its own and does not replay in the same session", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-intro", "done", { timeout: 8_000 });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-intro", "skip");
  });

  test("is skipped for reduced-motion users", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-intro", "skip");
    await expect(page.getByTestId("intro-overlay")).toBeHidden();
    await context.close();
  });
});

test.describe("honey lab", () => {
  test.beforeEach(async ({ page }) => {
    await skipIntro(page);
    await page.goto("/#honey-lab");
  });

  test("jars stay locked until a comb is harvested", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Harvest a honeycomb first to fill the 1 kg jar/ })).toBeDisabled();
  });

  test("adds a jar with the button and shows it in the hive", async ({ page }) => {
    await harvest(page, "Sidr Honey");
    await page.getByRole("button", { name: "Add Sidr Honey 1 kg to your hive" }).click();

    const hive = page.getByTestId("cart-hive");
    await expect(hive).toHaveAccessibleName("Open your hive, 1 jar");
    await hive.click();

    const drawer = page.getByRole("dialog", { name: "Your hive" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByTestId("drawer-subtotal")).toHaveText("Rs 6,000");
    await drawer.getByRole("button", { name: "Add one more Sidr Honey 1 kg" }).click();
    await expect(drawer.getByTestId("drawer-subtotal")).toHaveText("Rs 12,000");
  });

  test("adds a jar by dragging it into the hive", async ({ page, isMobile }) => {
    test.skip(isMobile, "Mouse drag is exercised on desktop; touch uses the same code path.");
    await harvest(page, "Wildflower Honey");

    const jar = page.getByTestId("lab-jar-2kg");
    const hive = page.getByTestId("cart-hive");
    await jar.scrollIntoViewIfNeeded();
    const from = await jar.boundingBox();
    const to = await hive.boundingBox();
    if (!from || !to) throw new Error("Missing jar or hive");

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
    await page.mouse.up();

    await expect(hive).toHaveAccessibleName("Open your hive, 1 jar");
  });
});
