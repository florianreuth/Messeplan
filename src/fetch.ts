// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { astro } from "astro/hono";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { streamSSE } from "hono/streaming";
import { services } from "./server/instance.ts";

const HEARTBEAT_MS = 25_000;
const RECONNECT_MS = 5_000;

const app = new Hono();

app.use(secureHeaders());
app.use(compress());

/** Announces each new revision, so open pages refresh without polling. */
app.get("/api/events", (context) => streamSSE(context, async (stream) => {
    const { repository } = services();
    const announce = (revision: number) => void stream.writeSSE({ event: "revision", data: String(revision), retry: RECONNECT_MS });
    const unsubscribe = repository.subscribe(announce);
    stream.onAbort(unsubscribe);

    announce(repository.revision);
    // Keeps proxies from closing the idle connection
    while (!stream.aborted) {
        await stream.sleep(HEARTBEAT_MS);
        await stream.writeSSE({ event: "ping", data: "" });
    }
}));

app.use(astro());

export default app;
