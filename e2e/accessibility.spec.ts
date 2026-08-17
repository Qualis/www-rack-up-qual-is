import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy on homepage", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();

    expect(await h1.count()).toBeGreaterThan(0);
  });

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/");

    const images = page.locator("img");
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute("alt");

        expect(alt).not.toBeNull();
      }
    }
  });

  test("should have proper link text (no 'click here')", async ({ page }) => {
    await page.goto("/");

    const badLinks = page.locator(
      'a:has-text("click here"), a:has-text("here")'
    );
    expect(await badLinks.count()).toBe(0);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const links = page.locator("a, button");
    const linkCount = await links.count();

    expect(linkCount).toBeGreaterThan(0);
  });

  test("should have lang attribute on html element", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    const lang = await html.getAttribute("lang");

    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });

  test("should have proper viewport meta tag", async ({ page }) => {
    await page.goto("/");

    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute("content", /width=device-width/);
  });

  test("should have skip to main content link", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.locator('a[href="#main"]');

    await expect(skipLink).toHaveText(/skip to main content/i);
  });

  test("should reveal the skip link on keyboard focus", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    await expect(page.locator('a[href="#main"]')).toBeFocused();
  });

  test("should let every set be checked off from the keyboard", async ({
    page,
  }) => {
    await page.goto("/");

    const firstSet = page.getByRole("checkbox", {
      name: "Barbell Bench Press set 1",
    });
    await firstSet.focus();
    await page.keyboard.press("Space");

    await expect(firstSet).toBeChecked();
  });
});
