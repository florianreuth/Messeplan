// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { defineConfig, devices } from "@playwright/test";

const PORT = 4398;

export default defineConfig({
    testDir: "e2e",
    // All specs share one seeded server, so they run one after another
    workers: 1,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL: `http://localhost:${PORT}`,
        locale: "de-DE",
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "npx astro build && node e2e/seed.ts && node dist/server/entry.mjs",
        url: `http://localhost:${PORT}/api/data`,
        reuseExistingServer: false,
        timeout: 180_000,
        env: {
            PORT: String(PORT),
            DATABASE_PATH: "test-results/e2e/messeplan.db",
        },
    },
});
