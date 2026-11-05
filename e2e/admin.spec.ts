// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { expect, test } from "@playwright/test";
import { ADMIN_PASSWORD, hydrated, open, storedData } from "./fixtures.ts";

test("requires a login and validates the password", async ({ page }) => {
    await open(page, "/admin/aussteller");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Faussteller/);

    const submit = page.getByRole("button", { name: "Anmelden" });
    await submit.click();
    await expect(page.getByText("Bitte Passwort eingeben.")).toBeVisible();

    await page.getByLabel("Passwort").fill("falsch");
    await submit.click();
    await expect(page.getByText("Falsches Passwort.")).toBeVisible();

    await page.getByLabel("Passwort").fill(ADMIN_PASSWORD);
    await submit.click();
    await expect(page).toHaveURL("/admin/aussteller");
});

test("creates an exhibitor and open public pages update live", async ({ browser }) => {
    const visitor = await browser.newPage();
    await open(visitor, "/");
    await expect(visitor.getByText("Muster GmbH").first()).toBeVisible();
    await expect(visitor.getByText("Validierung GmbH")).toHaveCount(0);

    const admin = await browser.newPage();
    await open(admin, "/admin/aussteller");
    await admin.getByLabel("Passwort").fill(ADMIN_PASSWORD);
    await admin.getByRole("button", { name: "Anmelden" }).click();
    await admin.waitForURL("/admin/aussteller");
    await hydrated(admin);

    await admin.getByRole("button", { name: "Aussteller hinzufügen" }).click();
    const dialog = admin.getByRole("dialog", { name: "Neuer Aussteller" });
    await dialog.getByLabel("Bereich").selectOption("C");
    await dialog.getByLabel("Stand-Nr.").fill("3");
    await dialog.getByLabel("Name / Firma").fill("Validierung GmbH");
    await dialog.getByLabel("E-Mail").fill("keine-mail");
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog.getByText("Ungültige E-Mail-Adresse")).toBeVisible();

    await dialog.getByLabel("E-Mail").fill("info@validierung.de");
    await dialog.getByRole("button", { name: "Speichern" }).click();
    await expect(dialog).toBeHidden();

    // Arrives through the live event stream, the visitor page is not reloaded
    await expect(visitor.getByText("Validierung GmbH")).toBeVisible();
    expect((await storedData(admin)).exhibitors.find((exhibitor) => exhibitor.id === "C3")?.contactEmail).toBe("info@validierung.de");
});
