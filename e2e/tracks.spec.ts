// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { expect, test } from "@playwright/test";
import { login, open } from "./fixtures.ts";

test("configures a track and uses it for a new class", async ({ page }) => {
    await login(page, "/admin/einstellungen");
    const tracks = page.locator(".card", { has: page.getByRole("heading", { name: "Zweige" }) });
    await tracks.getByRole("button", { name: "+ Hinzufügen" }).click();

    const trackDialog = page.getByRole("dialog", { name: "Zweig hinzufügen" });
    await trackDialog.getByLabel("Kürzel").fill("BG");
    await trackDialog.getByLabel("Bezeichnung").fill("Berufliches Gymnasium");
    await trackDialog.getByLabel("Erster Jahrgang").fill("11");
    await trackDialog.getByLabel("Letzter Jahrgang").fill("10");
    await trackDialog.getByLabel(/Mehrere Klassen pro Jahrgang/).uncheck();
    await trackDialog.getByRole("button", { name: "Speichern" }).click();
    await expect(trackDialog.getByRole("alert")).toContainText("Jahrgänge liegen zwischen 1 und 13");

    await trackDialog.getByLabel("Letzter Jahrgang").fill("13");
    await trackDialog.getByRole("button", { name: "Speichern" }).click();
    await expect(trackDialog).toBeHidden();
    await expect(tracks.getByText("Berufliches Gymnasium")).toBeVisible();

    await open(page, "/admin/klassen");
    await page.getByRole("button", { name: "+ Klasse hinzufügen" }).click();
    const classDialog = page.getByRole("dialog", { name: "Neue Klasse" });
    await classDialog.getByLabel("Zweig").selectOption("BG");
    await expect(classDialog.getByLabel("Klasse", { exact: true })).toHaveCount(0);
    await classDialog.getByRole("button", { name: "12", exact: true }).click();
    await expect(classDialog.getByText("12BG")).toBeVisible();
    await classDialog.getByRole("button", { name: "Speichern" }).click();
    await expect(classDialog).toBeHidden();
    await expect(page.getByText("Berufliches Gymnasium 12")).toBeVisible();

    // A track that still has classes cannot be deleted
    await open(page, "/admin/einstellungen");
    const row = tracks.locator("div", { hasText: "Berufliches Gymnasium" }).filter({ has: page.getByRole("button", { name: "Löschen" }) }).last();
    await row.getByRole("button", { name: "Löschen" }).click();
    await expect(tracks.getByRole("alert")).toHaveText("Dem Zweig sind noch 1 Klassen zugeordnet.");
});
