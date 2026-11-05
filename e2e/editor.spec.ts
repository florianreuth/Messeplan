// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { expect, type Locator, type Page, test } from "@playwright/test";
import { login, storedBooth } from "./fixtures.ts";

// Snapping may move a booth up to 10 floor units; errors this test guards against are far larger
const SNAP_TOLERANCE = 10;

function boothRect(page: Page, id: string): Locator {
    return page.locator(`g:has(> text:text-is("${id}")) > rect`).first();
}

async function dragBy(page: Page, target: Locator, dx: number, dy: number): Promise<void> {
    const box = (await target.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 10 });
    await page.mouse.up();
}

test("moves booths by dragging, also in a zoomed view", async ({ page }) => {
    await login(page, "/admin/lageplan");
    const booth = boothRect(page, "B1");
    const start = (await storedBooth(page, "B1"))!;

    await dragBy(page, booth, -100, -50);
    await expect.poll(async () => (await storedBooth(page, "B1"))?.x).toBeLessThan(start.x - 30);
    const moved = (await storedBooth(page, "B1"))!;
    expect(moved.y).toBeLessThan(start.y - 15);

    await page.getByRole("button", { name: "Vergrößern" }).click();
    const reset = page.getByRole("button", { name: "Ansicht zurücksetzen" });
    await expect(reset).toBeVisible();
    const pxPerUnit = (await booth.boundingBox())!.width / moved.width;

    await dragBy(page, booth, 0, 60);
    // The drag maps to floor units of the zoomed view; the tolerance allows for snapping to nearby edges
    await expect.poll(async () => (await storedBooth(page, "B1"))?.y).toBeGreaterThan(moved.y + 20);
    const zoomed = (await storedBooth(page, "B1"))!;
    expect(Math.abs(zoomed.y - (moved.y + 60 / pxPerUnit))).toBeLessThan(SNAP_TOLERANCE);
    expect(Math.abs(zoomed.x - moved.x)).toBeLessThan(SNAP_TOLERANCE);
    await expect(reset).toBeVisible();
});
