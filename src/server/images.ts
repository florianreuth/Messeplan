// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { badRequest } from "./errors.ts";
import type { StoredImage } from "./repository.ts";

/** Upload limit before processing; stored logos are much smaller after resizing. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Logos are shown at most ~220 px wide (header), so 512 px covers high-density screens
const MAX_EDGE_PX = 512;
const WEBP_QUALITY = 85;
const RASTER_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);
const SVG_ROOT = /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i;
const SVG_SNIFF_BYTES = 4096;

const UNSUPPORTED = "Nur PNG, JPG, GIF, WebP, AVIF und SVG werden unterstützt.";

/**
 * Checks the actual content instead of the declared type and normalizes raster images to a small WebP.
 * @throws DomainError (BAD_REQUEST) for anything that is not a supported image
 */
export async function prepareImage(data: Uint8Array): Promise<StoredImage> {
    if (data.byteLength > MAX_IMAGE_BYTES) {
        throw badRequest("Datei zu groß (max. 2 MB).");
    }

    const type = await fileTypeFromBuffer(data);
    if (type && RASTER_TYPES.has(type.mime)) {
        const image = sharp(data, { animated: true });
        // Already processed logos (e.g. from a backup) pass unchanged, so their content hash and URL stay stable
        const { width = 0, height = 0, pageHeight } = await image.metadata().catch(() => ({ width: 0, height: 0, pageHeight: 0 }));
        if (type.mime === "image/webp" && width > 0 && Math.max(width, pageHeight ?? height) <= MAX_EDGE_PX) {
            return { mime: "image/webp", data };
        }
        const webp = await image
            .rotate()
            .resize(MAX_EDGE_PX, MAX_EDGE_PX, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toBuffer()
            .catch(() => {
                throw badRequest("Das Bild konnte nicht gelesen werden.");
            });
        return { mime: "image/webp", data: webp };
    }

    // file-type reports SVGs as unknown or generic XML, so the root element decides; served sandboxed (see /media)
    const textual = !type || type.mime === "application/xml";
    if (textual && SVG_ROOT.test(new TextDecoder().decode(data.subarray(0, SVG_SNIFF_BYTES)))) {
        return { mime: "image/svg+xml", data };
    }
    throw badRequest(UNSUPPORTED);
}
