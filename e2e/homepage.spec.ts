import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the workout as the home page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/RackUp/i);
  });

  test("should show the RackUp product name in the navigation", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /RackUp/ })).toBeVisible();
  });

  test("should describe the app for the browser", async ({ page }) => {
    await page.goto("/");

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /.+/);
  });

  test("should link the manifest so the app can be installed", async ({
    page,
  }) => {
    await page.goto("/");

    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute("href", /site\.webmanifest/);
  });

  test("should tell the user their progress stays in the browser", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByText(/keeps your progress in this browser only/)
    ).toBeVisible();
  });
});
