// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { DomainError } from "./errors.ts";
import { prepareImage } from "./images.ts";

const isBadRequest = (cause: unknown) => cause instanceof DomainError && cause.code === "BAD_REQUEST";

describe("prepareImage", () => {
    it("shrinks large raster images to a WebP of at most 512 px", async () => {
        const png = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "#1a2947" } }).png().toBuffer();
        const image = await prepareImage(png);
        const { format, width, height } = await sharp(image.data).metadata();
        assert.equal(image.mime, "image/webp");
        assert.deepEqual([format, width, height], ["webp", 512, 256]);
    });

    it("keeps already small WebPs byte for byte", async () => {
        const webp = await sharp({ create: { width: 100, height: 50, channels: 3, background: "#ffffff" } }).webp().toBuffer();
        assert.deepEqual((await prepareImage(webp)).data, webp);
    });

    it("stores SVGs unchanged", async () => {
        const svg = Buffer.from("<?xml version=\"1.0\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\"/>");
        assert.deepEqual(await prepareImage(svg), { mime: "image/svg+xml", data: svg });
    });

    it("rejects content that only claims to be an image", async () => {
        await assert.rejects(prepareImage(Buffer.from("<html><script>alert(1)</script></html>")), isBadRequest);
        await assert.rejects(prepareImage(Buffer.from("%PDF-1.7 fake")), isBadRequest);
    });
});
