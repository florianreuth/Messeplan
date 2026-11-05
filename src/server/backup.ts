// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { backupSchema } from "../lib/schemas.ts";
import type { AppData } from "../lib/types.ts";
import { badRequest, DomainError } from "./errors.ts";
import { prepareImage } from "./images.ts";
import { MEDIA_PREFIX, type Repository, type StoredImage } from "./repository.ts";

const DATA_URL = /^data:[\w/+.-]+;base64,(.*)$/s;

function encodeDataUrl({ mime, data }: StoredImage): string {
    return `data:${mime};base64,${Buffer.from(data).toString("base64")}`;
}

/** The complete data with uploaded images inlined as data URLs, so the backup is self-contained. */
export function exportBackup(repository: Repository): AppData {
    const data = repository.readData();
    const inline = (url: string | undefined) => {
        if (!url?.startsWith(MEDIA_PREFIX)) {
            return url;
        }
        const image = repository.image(url.slice(MEDIA_PREFIX.length));
        return image ? encodeDataUrl(image) : undefined;
    };
    return {
        ...data,
        event: { ...data.event, logoUrl: inline(data.event.logoUrl) },
        exhibitors: data.exhibitors.map((exhibitor) => ({ ...exhibitor, logoUrl: inline(exhibitor.logoUrl) })),
    };
}

/** Replaces all content with an exported backup; returns the new revision. Unusable inline logos are dropped. */
export async function importBackup(repository: Repository, raw: unknown): Promise<number> {
    const result = backupSchema.safeParse(raw);
    if (!result.success) {
        const [issue] = result.error.issues;
        throw badRequest(`Ungültige Sicherungsdatei (${issue.path.join(".")}: ${issue.message})`);
    }

    // Inline logos pass the same checks as uploads; a broken one should not fail the whole restore
    const store = async (url: string | undefined) => {
        const match = url && DATA_URL.exec(url);
        if (!match) {
            return url;
        }
        try {
            const image = await prepareImage(Buffer.from(match[1], "base64"));
            return repository.storeImage(image.data, image.mime);
        } catch (cause) {
            if (cause instanceof DomainError) {
                return undefined;
            }
            throw cause;
        }
    };
    const data = result.data;
    const event = { ...data.event, logoUrl: await store(data.event.logoUrl) };
    const exhibitors = await Promise.all(data.exhibitors.map(async (exhibitor) =>
        ({ ...exhibitor, logoUrl: await store(exhibitor.logoUrl) })));
    const revision = repository.replaceAll({ ...data, event, exhibitors });
    repository.pruneImages();
    return revision;
}
