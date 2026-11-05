// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { Page } from "@playwright/test";
import type { AppData, Booth } from "../src/lib/types.ts";

export const ADMIN_PASSWORD = "e2e-password";

// Input before hydration is lost, and Playwright is faster than any user; Astro drops `ssr` once an island hydrated
export async function hydrated(page: Page): Promise<void> {
    await page.locator("astro-island:not([ssr])").first().waitFor({ state: "attached" });
}

/** Navigates and waits until the page's island is interactive. */
export async function open(page: Page, path: string): Promise<void> {
    await page.goto(path);
    await hydrated(page);
}

/** Signs in through the login page and waits for the requested admin page. */
export async function login(page: Page, path = "/admin"): Promise<void> {
    await open(page, path);
    await page.getByLabel("Passwort").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(path);
    await hydrated(page);
}

/** The data as the server has stored it, read through the public endpoint. */
export async function storedData(page: Page): Promise<AppData> {
    const response = await page.request.get("/api/data");
    return (await response.json() as { data: AppData }).data;
}

export async function storedBooth(page: Page, exhibitorId: string): Promise<Booth | undefined> {
    const { floorPlan } = await storedData(page);
    return floorPlan.floors.flatMap((floor) => floor.booths).find((booth) => booth.exhibitorId === exhibitorId);
}
