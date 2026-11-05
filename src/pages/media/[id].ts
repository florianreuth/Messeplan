// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { APIRoute } from "astro";
import { services } from "../../server/instance.ts";

const IMMUTABLE = "public, max-age=31536000, immutable";

/** Serves uploaded images; ids are content hashes, so responses never change and are cached forever. */
export const GET: APIRoute = ({ params }) => {
    const image = params.id ? services().repository.image(params.id) : null;
    if (!image) {
        return new Response("Nicht gefunden", { status: 404 });
    }

    const headers: Record<string, string> = { "content-type": image.mime, "cache-control": IMMUTABLE };
    // SVGs can carry scripts; this stops them from running if the file is opened directly
    if (image.mime === "image/svg+xml") {
        headers["content-security-policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
    }
    return new Response(new Uint8Array(image.data), { headers });
};
