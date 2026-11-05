// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { expect, test } from "@playwright/test";
import { hydrated, open } from "./fixtures.ts";

test("shows the stand details in a dialog that returns focus", async ({ page }) => {
    await open(page, "/");
    const booth = page.getByRole("button", { name: "Stand A1: Muster GmbH" });
    await booth.click();

    const dialog = page.getByRole("dialog", { name: "Stand A1" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Ausbildung im Handwerk");
    await expect(dialog.getByRole("button", { name: "Schließen" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(booth).toBeFocused();
});

test("zooms the floor plan and resets the view", async ({ page }) => {
    await open(page, "/");
    const reset = page.getByRole("button", { name: "Ansicht zurücksetzen" });
    await expect(reset).toBeHidden();
    await page.getByRole("button", { name: "Vergrößern" }).click();
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(reset).toBeHidden();
});

test("filters exhibitors by search", async ({ page }) => {
    await open(page, "/");
    await page.getByRole("searchbox").fill("Hochschule");
    // Other specs may add exhibitors, so only the number of hits is fixed
    await expect(page.getByText(/^1 von \d+ Ausstellern$/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Muster GmbH/ }).filter({ hasText: "Stand A1" })).toHaveCount(0);
});

test("remembers the selected class across visits", async ({ page }) => {
    await open(page, "/klassen");
    await page.getByRole("button", { name: "5aG 28", exact: true }).click();
    await expect(page.getByText("Klasse 5aG")).toBeVisible();

    await page.reload();
    await hydrated(page);
    await expect(page.getByText("Klasse 5aG")).toBeVisible();

    await page.getByRole("button", { name: "Andere Klasse" }).click();
    await expect(page.getByRole("button", { name: "5aG 28", exact: true })).toBeVisible();
});

test("keeps the chosen dark mode after reloading", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await open(page, "/");
    await page.getByRole("button", { name: "Dunkles Design" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
});
