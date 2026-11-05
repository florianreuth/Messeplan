// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { APIRoute } from "astro";
import { services } from "../../server/instance.ts";

// After every change all open pages refetch at once, so unchanged data is answered with a 304 from the revision
export const GET: APIRoute = ({ request }) => {
    const { repository } = services();
    const etag = `"${repository.revision}"`;
    const headers = { "etag": etag, "cache-control": "no-cache" };
    if (request.headers.get("if-none-match") === etag) {
        return new Response(null, { status: 304, headers });
    }
    return new Response(repository.snapshotJson(), {
        headers: { ...headers, "content-type": "application/json; charset=utf-8" },
    });
};
