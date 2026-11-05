// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { defineConfig, sessionDrivers } from "astro/config";
import node from "@astrojs/node";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// Backups carry all logos inline, so restoring one needs more than the default 1 MB
const MAX_BODY_BYTES = 64 * 1024 * 1024;

export default defineConfig({
    output: "server",
    adapter: node({ mode: "standalone", bodySizeLimit: MAX_BODY_BYTES }),
    integrations: [svelte()],
    security: { actionBodySizeLimit: MAX_BODY_BYTES },
    session: {
        driver: sessionDrivers.fsLite({ base: "data/sessions" }),
        ttl: 8 * 60 * 60,
        cookie: { name: "messeplan_session", sameSite: "strict" },
    },
    vite: {
        plugins: [tailwindcss()],
    },
});
