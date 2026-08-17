import { test, expect } from "@playwright/test";

test.describe("Theme Switcher", () => {
  test("should have theme switcher visible", async ({ page }) => {
    await page.goto("/");

    const themeSwitcher = page.locator(
      '[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"], [data-testid="theme-switcher"]'
    );

    expect(await themeSwitcher.count()).toBeGreaterThan(0);
  });

  test("should toggle theme when clicked", async ({ page }) => {
    await page.goto("/");

    const initialTheme = await page.locator("html").getAttribute("data-theme");
    const initialClass = await page.locator("html").getAttribute("class");

    const themeSwitcher = page
      .locator(
        '[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"], [data-testid="theme-switcher"]'
      )
      .first();

    if (await themeSwitcher.isVisible()) {
      await themeSwitcher.click();

      await page.waitForTimeout(300);

      const newTheme = await page.locator("html").getAttribute("data-theme");
      const newClass = await page.locator("html").getAttribute("class");

      const themeChanged =
        newTheme !== initialTheme || newClass !== initialClass;
      expect(themeChanged).toBe(true);
    }
  });

  test("should persist theme preference across a reload", async ({ page }) => {
    await page.goto("/");

    const themeSwitcher = page
      .locator(
        '[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"], [data-testid="theme-switcher"]'
      )
      .first();

    if (await themeSwitcher.isVisible()) {
      await themeSwitcher.click();
      await page.waitForTimeout(300);

      const themeAfterSwitch = await page
        .locator("html")
        .getAttribute("data-theme");
      const classAfterSwitch = await page.locator("html").getAttribute("class");

      await page.reload();

      const themeOnNewPage = await page
        .locator("html")
        .getAttribute("data-theme");
      const classOnNewPage = await page.locator("html").getAttribute("class");

      expect(themeOnNewPage).toBe(themeAfterSwitch);
      expect(classOnNewPage).toBe(classAfterSwitch);
    }
  });
});
