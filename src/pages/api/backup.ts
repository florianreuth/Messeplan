// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { APIRoute } from "astro";
import { exportBackup } from "../../server/backup.ts";
import { services } from "../../server/instance.ts";

/** Downloads all content as a self-contained JSON file; restoring goes through the `backup.restore` action. */
export const GET: APIRoute = async ({ session }) => {
    if (await session?.get("admin") !== true) {
        return new Response(null, { status: 401 });
    }

    const stamp = new Date().toISOString().slice(0, 10);
    return Response.json(exportBackup(services().repository), {
        headers: {
            "content-disposition": `attachment; filename="messeplan_${stamp}.json"`,
            "cache-control": "no-store",
        },
    });
};
