import { test, expect } from "@playwright/test";

const STORAGE_KEY = "rackup-workout-state";
const PAGE_LOAD_TIME = new Date("2026-08-16T08:00:00");
const REST_START_TIME = new Date("2026-08-16T09:00:00");

test.describe("RackUp workout", () => {
  test("should show the program title", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Home Strength Program", level: 1 })
    ).toBeVisible();
  });

  test("should offer every day of the split", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /Day 1 — Push/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Day 2 — Pull/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Day 3 — Legs/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Day 4 — Full Body/ })
    ).toBeVisible();
  });

  test("should mark the fourth day as optional", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Day 4 — Full Body/ }).click();

    await expect(page.getByText("Optional", { exact: true })).toBeVisible();
  });

  test("should show the warm-up block for the day", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Warm-up" })).toBeVisible();
  });

  test("should render an inline illustration for each exercise", async ({
    page,
  }) => {
    await page.goto("/");

    const illustrations = page.locator(
      '[data-testid="workout-illustration"] svg'
    );

    expect(await illustrations.count()).toBeGreaterThan(0);
  });

  test("should link out to the external demo in a new tab", async ({
    page,
  }) => {
    await page.goto("/");

    const demoLink = page
      .getByRole("link", { name: /Barbell Bench Press/ })
      .first();

    await expect(demoLink).toHaveAttribute("target", "_blank");
    await expect(demoLink).toHaveAttribute(
      "href",
      /musclewiki\.com\/exercise\//
    );
  });

  test("should offer a checkbox for every set of an exercise", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("checkbox", { name: "Barbell Bench Press set 4" })
    ).toBeVisible();
  });

  test("should keep a checked set after a full page reload", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    await page.reload();

    await expect(
      page.getByRole("checkbox", { name: "Barbell Bench Press set 1" })
    ).toBeChecked();
  });

  test("should persist progress under the RackUp storage key", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY
    );
    expect(stored).toContain("bench");
  });

  test("should update the day progress as sets are checked off", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    await expect(page.getByText("1 of 16 sets done")).toBeVisible();
  });

  test("should start the rest timer when a set is checked off", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    await expect(
      page.getByRole("region", { name: "Rest timer" })
    ).toBeVisible();
  });

  test("should count the rest down from the exercise rest duration", async ({
    page,
  }) => {
    await page.clock.install({ time: PAGE_LOAD_TIME });
    await page.goto("/");
    await page.clock.pauseAt(REST_START_TIME);
    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    await expect(page.getByText("3:00")).toBeVisible();
    await page.clock.runFor("00:02");

    await expect(page.getByText("2:58")).toBeVisible();
  });

  test("should keep the rest running while another day is browsed", async ({
    page,
  }) => {
    await page.clock.install({ time: PAGE_LOAD_TIME });
    await page.goto("/");
    await page.clock.pauseAt(REST_START_TIME);
    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    await expect(page.getByText("3:00")).toBeVisible();

    await page.getByRole("button", { name: /Day 4 — Full Body/ }).click();
    await page.clock.runFor("01:00");

    await expect(page.getByText("2:00")).toBeVisible();
  });

  test("should not carry a reset confirmation across to another day", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Reset day" }).click();
    await page.getByRole("button", { name: /Day 4 — Full Body/ }).click();

    await expect(
      page.getByRole("button", { name: "Confirm reset" })
    ).toBeHidden();
  });

  test("should stop the rest timer when it is skipped", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    await page.getByRole("button", { name: "Skip" }).click();

    await expect(page.getByRole("region", { name: "Rest timer" })).toBeHidden();
  });

  test("should announce the finish once the rest is over", async ({ page }) => {
    await page.clock.install({ time: PAGE_LOAD_TIME });
    await page.goto("/");
    await page.clock.pauseAt(REST_START_TIME);
    await page.getByRole("checkbox", { name: "Plank set 1" }).check();
    await expect(page.getByText("0:45")).toBeVisible();

    await page.clock.fastForward("00:46");

    await expect(page.getByText("Rest complete — next set")).toBeVisible();
  });

  test("should clear the finished rest timer with nothing to dismiss", async ({
    page,
  }) => {
    await page.clock.install({ time: PAGE_LOAD_TIME });
    await page.goto("/");
    await page.clock.pauseAt(REST_START_TIME);
    await page.getByRole("checkbox", { name: "Plank set 1" }).check();
    await expect(page.getByText("0:45")).toBeVisible();

    await page.clock.fastForward("00:46");

    await expect(page.getByRole("region", { name: "Rest timer" })).toBeHidden();
  });

  test("should stay accurate while the tab is hidden rather than drifting", async ({
    page,
  }) => {
    await page.clock.install({ time: PAGE_LOAD_TIME });
    await page.goto("/");
    await page.clock.pauseAt(REST_START_TIME);
    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();
    await expect(page.getByText("3:00")).toBeVisible();

    await page.clock.fastForward("02:00");

    await expect(page.getByText("1:00")).toBeVisible();
  });

  test("should clear a day when the reset is confirmed", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    await page.getByRole("button", { name: "Reset day" }).click();
    await page.getByRole("button", { name: "Confirm reset" }).click();

    await expect(page.getByText("0 of 16 sets done")).toBeVisible();
  });

  test("should surface the weekly schedule and the programme notes", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Weekly schedule" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
  });

  test("should keep an adjusted weight after a full page reload", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
      .click();
    await page.getByRole("button", { name: /Increase weight/ }).click();
    await page.getByRole("button", { name: /^Done/ }).click();

    await page.reload();

    await expect(
      page.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    ).toHaveText(/42.5 kg/);
  });

  test("should show what the programme prescribed once a weight is adjusted", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
      .click();
    await page.getByRole("button", { name: /Increase weight/ }).click();
    await page.getByRole("button", { name: /^Done/ }).click();

    await expect(
      page.getByRole("button", {
        name: /reset weight for every set of Barbell Bench Press/i,
      })
    ).toHaveText(/was 40 kg/);
  });

  test("should restore the programme weight when the adjustment is reset", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
      .click();
    await page.getByRole("button", { name: /Increase weight/ }).click();
    await page.getByRole("button", { name: /^Done/ }).click();

    await page
      .getByRole("button", {
        name: /reset weight for every set of Barbell Bench Press/i,
      })
      .click();

    await expect(
      page.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    ).toHaveText(/40 kg/);
  });

  test("should carry an adjusted weight to the other day sharing the exercise", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for every set of Standing Neutral-Grip DB Press/,
      })
      .click();
    await page.getByRole("button", { name: /Increase weight/ }).click();
    await page.getByRole("button", { name: /^Done/ }).click();

    await page.getByRole("button", { name: /Day 4 — Full Body/ }).click();

    await expect(
      page.getByRole("button", {
        name: /change weight for every set of Standing Neutral-Grip DB Press/,
      })
    ).toHaveText(/12.5 kg ea/);
  });

  test("should keep completed sets recorded before adjustments were supported", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "rackup-workout-state",
        JSON.stringify({
          version: 1,
          days: {
            "1": {
              lastActiveDate: "2026-08-16",
              completedSets: { bench: [0] },
            },
          },
        })
      );
    });

    await page.goto("/");

    await expect(
      page.getByRole("checkbox", { name: "Barbell Bench Press set 1" })
    ).toBeChecked();
  });

  test("should keep a typed weight when the field is left without pressing Done", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
      .click();
    await page
      .getByLabel(/Weight for every set of Barbell Bench Press/)
      .fill("60 kg");

    await page.getByRole("button", { name: /Day 4 — Full Body/ }).click();
    await page.getByRole("button", { name: /Day 1 — Push/ }).click();

    await expect(
      page.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    ).toHaveText(/60 kg/);
  });

  test("should never let the reps be stepped down to zero", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change reps for every set of Barbell Bench Press/,
      })
      .click();

    const decrease = page.getByRole("button", { name: /Decrease reps/ });
    for (let tap = 0; tap < 6; tap += 1) {
      if (await decrease.isEnabled()) {
        await decrease.click();
      }
    }

    await expect(
      page.getByLabel(/Reps for every set of Barbell Bench Press/)
    ).toHaveValue("1");
  });

  test("should return an adjusted weight to where it started after equal steps down and up", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
      .click();

    await page.getByRole("button", { name: /Decrease weight/ }).click();
    await page.getByRole("button", { name: /Increase weight/ }).click();
    await page.getByRole("button", { name: /^Done/ }).click();

    await expect(
      page.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    ).toHaveText(/40 kg/);
  });

  test("should vary the weight of a single set and keep it after a reload", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
      .click();
    await page.getByRole("button", { name: /Increase weight/ }).click();
    await page.getByRole("button", { name: /^Done/ }).click();

    await page.reload();

    await expect(
      page.getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
    ).toHaveText(/42.5 kg/);
  });

  test("should leave the other sets on the programme weight when one set is varied", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: /change weight for set 2 of Barbell Bench Press/,
      })
      .click();
    await page.getByRole("button", { name: /Increase weight/ }).click();
    await page.getByRole("button", { name: /^Done/ }).click();

    await expect(
      page.getByRole("button", {
        name: /change weight for set 1 of Barbell Bench Press/,
      })
    ).toHaveText(/40 kg/);
  });

  test("should show a stored adjustment recorded before per-set values existed", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "rackup-workout-state",
        JSON.stringify({
          version: 2,
          days: {
            "1": {
              lastActiveDate: "2026-08-16",
              completedSets: { bench: [0] },
            },
          },
          exercises: { bench: { reps: null, weight: "45 kg" } },
        })
      );
    });

    await page.goto("/");

    await expect(
      page.getByRole("button", {
        name: /change weight for every set of Barbell Bench Press/,
      })
    ).toHaveText(/45 kg/);
    await expect(
      page.getByRole("checkbox", { name: "Barbell Bench Press set 1" })
    ).toBeChecked();
  });

  test("should present each exercise's sets as a table row per set", async ({
    page,
  }) => {
    await page.goto("/");

    const benchTable = page
      .getByRole("table", { name: /Barbell Bench Press sets/ })
      .first();

    await expect(
      benchTable.getByRole("rowheader", { name: "Set 4" })
    ).toBeVisible();
    await expect(
      benchTable.getByRole("rowheader", { name: "Every set" })
    ).toBeVisible();
  });

  test("should report no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });

    await page.goto("/");
    await page
      .getByRole("checkbox", { name: "Barbell Bench Press set 1" })
      .check();

    expect(errors).toEqual([]);
  });
});
