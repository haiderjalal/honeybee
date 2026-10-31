import { expect, test } from "@playwright/test";

import { skipIntro, uniqueClientIp } from "./helpers";

const CART = JSON.stringify({
  state: { items: [{ varietySlug: "acacia-honey", sizeId: "500g", quantity: 2 }] },
  version: 1,
});

test.describe("checkout", () => {
  test.beforeEach(async ({ page }) => {
    await skipIntro(page);
    await page.setExtraHTTPHeaders(uniqueClientIp());
  });

  test("shows an empty state when the hive is empty", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Your hive is empty" })).toBeVisible();
  });

  test("validates fields, then submits an order request", async ({ page }) => {
    await page.addInitScript((cart) => window.localStorage.setItem("honeybee-cart", cart), CART);
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-subtotal")).toHaveText("Rs 3,800");

    await page.getByRole("button", { name: /Send order request/ }).click();
    await expect(page.getByText("Please enter your full name.")).toBeVisible();
    await expect(page.getByText("Please enter a valid mobile number, e.g. 0300 1234567.")).toBeVisible();

    await page.getByLabel("Full name").fill("Test Customer");
    await page.getByLabel("Mobile number").fill("0300 1234567");
    await page.getByLabel("City").fill("Lahore");
    await page.getByLabel("Delivery address").fill("House 1, Street 2, Test Town");
    await page.getByRole("button", { name: /Send order request/ }).click();

    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
    await expect(page.getByTestId("order-reference")).toHaveText(/^HB-\d{6}-[0-9A-Z]{4}$/);
    await expect(page.getByRole("button", { name: "Open your hive (cart)" }).first()).toBeVisible();
  });
});

test.describe("inquiry API", () => {
  test("rejects invalid payloads with field errors", async ({ request }) => {
    const response = await request.post("/api/inquiries", {
      data: { name: "A", items: [] },
      headers: uniqueClientIp(),
    });
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors).toHaveProperty("phone");
    expect(body.errors).toHaveProperty("items");
  });

  test("rejects malformed JSON", async ({ request }) => {
    const response = await request.post("/api/inquiries", {
      data: Buffer.from("{oops"),
      headers: { "content-type": "application/json", ...uniqueClientIp() },
    });
    expect(response.status()).toBe(400);
  });
});
