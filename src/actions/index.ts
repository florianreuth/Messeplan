// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { type ActionAPIContext, ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { adminPasswordMatches } from "../server/auth.ts";
import { importBackup } from "../server/backup.ts";
import type { Booth, EventInfo } from "../lib/types.ts";
import { type Collection, collections, type OnFloor } from "../server/collections.ts";
import { badRequest, DomainError } from "../server/errors.ts";
import { prepareImage } from "../server/images.ts";
import { services } from "../server/instance.ts";
import type { Repository, ScheduleChange } from "../server/repository.ts";
import { eventSchema, loginSchema, scheduleChangeSchema } from "../lib/schemas.ts";

/** Every write answers with the revision the data has afterwards. */
type Written = { revision: number };

const keyInput = z.object({ key: z.string().min(1) });
const fileInput = z.object({ file: z.instanceof(File) });

async function requireAdmin(context: ActionAPIContext): Promise<void> {
    if (await context.session?.get("admin") !== true) {
        throw new ActionError({ code: "UNAUTHORIZED", message: "Sitzung abgelaufen – bitte neu anmelden." });
    }
}

function translate(cause: unknown): never {
    if (cause instanceof DomainError) {
        throw new ActionError({ code: cause.code, message: cause.message });
    }
    throw cause;
}

/** Restricts an action handler to signed-in admins; domain errors become action errors with the same code. */
function asAdmin<TInput, TOutput>(handler: (input: TInput, repository: Repository) => TOutput | Promise<TOutput>) {
    return async (input: TInput, context: ActionAPIContext): Promise<TOutput> => {
        await requireAdmin(context);
        try {
            return await handler(input, services().repository);
        } catch (cause) {
            return translate(cause);
        }
    };
}

/** Create, update (full replacement) and remove for one collection of the registry. */
function collectionActions<T extends object>(collection: Collection<T>) {
    return {
        create: defineAction({
            input: collection.schema,
            handler: asAdmin((item: T, repository): Written => ({ revision: repository.insert(collection, item) })),
        }),
        update: defineAction({
            input: z.object({ key: z.string().min(1), item: collection.schema }),
            handler: asAdmin(({ key, item }: { key: string; item: T }, repository): Written => {
                if (!collection.renamable && collection.keyOf(item) !== key) {
                    throw badRequest("Die ID dieses Eintrags kann nicht geändert werden.");
                }
                return { revision: repository.update(collection, key, item) };
            }),
        }),
        remove: defineAction({
            input: keyInput,
            handler: asAdmin(({ key }: { key: string }, repository): Written => ({ revision: repository.remove(collection, key) })),
        }),
    };
}

export const server = {
    session: {
        login: defineAction({
            input: loginSchema,
            handler: async ({ password }, context) => {
                const { repository, loginLimiter } = services();
                const client = context.clientAddress;
                if ((await loginLimiter.get(client))?.remainingPoints === 0) {
                    throw new ActionError({ code: "TOO_MANY_REQUESTS", message: "Zu viele Fehlversuche – bitte in einigen Minuten erneut versuchen." });
                }
                if (!adminPasswordMatches(repository, password)) {
                    await loginLimiter.consume(client).catch(() => undefined);
                    throw new ActionError({ code: "UNAUTHORIZED", message: "Falsches Passwort." });
                }
                await loginLimiter.delete(client);
                // A fresh session id on login prevents session fixation
                await context.session?.regenerate();
                context.session?.set("admin", true);
            },
        }),
        logout: defineAction({
            handler: (_input, context) => context.session?.destroy(),
        }),
    },

    event: {
        update: defineAction({
            input: eventSchema,
            handler: asAdmin((event: EventInfo, repository): Written => ({ revision: repository.updateEvent(event) })),
        }),
    },

    categories: collectionActions(collections.categories),
    groups: collectionActions(collections.groups),
    exhibitors: collectionActions(collections.exhibitors),
    rooms: collectionActions(collections.rooms),
    talks: collectionActions(collections.talks),
    tracks: collectionActions(collections.tracks),
    classes: collectionActions(collections.classes),
    timeSlots: collectionActions(collections.timeSlots),
    labels: collectionActions(collections.labels),
    shapes: collectionActions(collections.shapes),

    floors: {
        ...collectionActions(collections.floors),
        remove: defineAction({
            input: keyInput,
            handler: asAdmin(({ key }: { key: string }, repository): Written => ({ revision: repository.removeFloor(key) })),
        }),
    },

    booths: {
        /** Places or moves the exhibitor's booth; an exhibitor has at most one. */
        place: defineAction({
            input: collections.booths.schema,
            handler: asAdmin((booth: OnFloor<Booth>, repository): Written => ({ revision: repository.upsert(collections.booths, booth) })),
        }),
        remove: defineAction({
            input: keyInput,
            handler: asAdmin(({ key }: { key: string }, repository): Written => ({ revision: repository.remove(collections.booths, key) })),
        }),
    },

    schedule: {
        /** Sets or (with `type: null`) clears the entry of one class, time slot and zone. */
        set: defineAction({
            input: scheduleChangeSchema,
            handler: asAdmin((change: ScheduleChange, repository): Written => ({ revision: repository.setScheduleEntry(change) })),
        }),
    },

    images: {
        /** Checks, resizes and stores an uploaded image; returns its URL for a logo field. */
        upload: defineAction({
            accept: "form",
            input: fileInput,
            handler: asAdmin(async ({ file }: { file: File }, repository) => {
                const image = await prepareImage(new Uint8Array(await file.arrayBuffer()));
                return { url: repository.storeImage(image.data, image.mime) };
            }),
        }),
    },

    backup: {
        /** Replaces all content with an exported backup file and returns the new snapshot. */
        restore: defineAction({
            accept: "form",
            input: fileInput,
            handler: async ({ file }, context) => {
                await requireAdmin(context);
                let raw: unknown;
                try {
                    raw = JSON.parse(await file.text());
                } catch {
                    throw new ActionError({ code: "BAD_REQUEST", message: "Ungültiges JSON-Format." });
                }
                const { repository } = services();
                try {
                    await importBackup(repository, raw);
                } catch (cause) {
                    return translate(cause);
                }
                return repository.snapshot();
            },
        }),
    },
};
