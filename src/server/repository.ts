// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { createHash } from "node:crypto";
import { and, count, eq, notInArray, sql } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { scheduleEntryId } from "../lib/data/collections.ts";
import { createDefaultData, DEFAULT_EVENT_NAME } from "../lib/data/defaults.ts";
import type { AppData, EventInfo, Floor, Id, ScheduleEntryType, Snapshot } from "../lib/types.ts";
import { type Collection, collections, type ConstraintMessages, type Row } from "./collections.ts";
import type { Database } from "./db/client.ts";
import * as schema from "./db/schema.ts";
import { conflict, DomainError, notFound } from "./errors.ts";

const SETTING_EVENT = "event";
const SETTING_REVISION = "revision";

export const MEDIA_PREFIX = "/media/";

const DEFAULT_MESSAGES: Required<ConstraintMessages> = {
    duplicate: "Ein Eintrag mit dieser ID existiert bereits.",
    unknownReference: "Der Eintrag verweist auf einen nicht vorhandenen Eintrag.",
    inUse: "Der Eintrag wird noch verwendet.",
};

// Drizzle wraps driver errors, so the SQLite code may sit further down the cause chain
function sqliteCode(cause: unknown): string | undefined {
    for (let error = cause; error instanceof Error; error = error.cause) {
        const code = (error as { code?: unknown }).code;
        if (typeof code === "string" && code.startsWith("SQLITE_CONSTRAINT")) {
            return code;
        }
    }
    return undefined;
}

function constraintError(cause: unknown, messages: ConstraintMessages = {}, deleting = false): DomainError | null {
    const code = sqliteCode(cause);
    if (!code) {
        return null;
    }
    const merged = { ...DEFAULT_MESSAGES, ...messages };
    if (code === "SQLITE_CONSTRAINT_PRIMARYKEY" || code === "SQLITE_CONSTRAINT_UNIQUE") {
        return conflict(merged.duplicate);
    }
    // ON DELETE RESTRICT reports as a trigger violation instead of a foreign key one
    if (code === "SQLITE_CONSTRAINT_FOREIGNKEY" || code === "SQLITE_CONSTRAINT_TRIGGER") {
        return conflict(deleting ? merged.inUse : merged.unknownReference);
    }
    return new DomainError("BAD_REQUEST", "Ungültige Daten.");
}

export interface ScheduleChange {
    classId: Id;
    timeSlotId: Id;
    zoneId: Id;
    type: ScheduleEntryType | null;
}

export interface StoredImage {
    mime: string;
    data: Uint8Array;
}

type Listener = (revision: number) => void;

/** All reads and writes of the fair data. Every write runs in a transaction and bumps the revision. */
export class Repository {
    readonly db: Database;
    readonly #listeners = new Set<Listener>();
    #snapshotCache: { revision: number; json: string } | null = null;

    constructor(db: Database) {
        this.db = db;
    }

    get revision(): number {
        return Number(this.getSetting(SETTING_REVISION) ?? 0);
    }

    getSetting(key: string): string | null {
        return this.db.select().from(schema.settings).where(eq(schema.settings.key, key)).get()?.value ?? null;
    }

    setSetting(key: string, value: string): void {
        this.db.insert(schema.settings).values({ key, value })
            .onConflictDoUpdate({ target: schema.settings.key, set: { value } }).run();
    }

    /** Fills an empty database with the default content; returns whether it did. */
    seedIfEmpty(): boolean {
        if (this.getSetting(SETTING_EVENT) !== null) {
            return false;
        }
        this.replaceAll(createDefaultData());
        return true;
    }

    all<T extends object>(collection: Collection<T>): T[] {
        const rows = this.db.select().from(collection.table).orderBy(...collection.orderBy).all() as Row[];
        return rows.map((row) => collection.fromRow(row));
    }

    readData(): AppData {
        const floors = new Map<Id, Floor>(this.all(collections.floors).map((floor) =>
            [floor.id, { ...floor, booths: [], labels: [], shapes: [] }]));
        for (const { floorId, ...booth } of this.all(collections.booths)) {
            floors.get(floorId)?.booths.push(booth);
        }
        for (const { floorId, ...label } of this.all(collections.labels)) {
            floors.get(floorId)?.labels.push(label);
        }
        for (const { floorId, ...shape } of this.all(collections.shapes)) {
            floors.get(floorId)?.shapes.push(shape);
        }

        const event = this.getSetting(SETTING_EVENT);
        return {
            event: event ? JSON.parse(event) as EventInfo : { name: DEFAULT_EVENT_NAME },
            categories: this.all(collections.categories),
            groups: this.all(collections.groups),
            exhibitors: this.all(collections.exhibitors),
            rooms: this.all(collections.rooms),
            talks: this.all(collections.talks),
            tracks: this.all(collections.tracks),
            classes: this.all(collections.classes),
            timeSlots: this.all(collections.timeSlots),
            classSchedule: this.db.select().from(schema.scheduleEntries).orderBy(sql`rowid`).all().map((entry) =>
                ({ id: scheduleEntryId(entry.classId, entry.timeSlotId, entry.zoneId), ...entry })),
            floorPlan: { floors: [...floors.values()] },
        };
    }

    snapshot(): Snapshot {
        return { revision: this.revision, data: this.readData() };
    }

    /** The current snapshot as JSON, cached until the next write since every open page reloads it after a change. */
    snapshotJson(): string {
        const revision = this.revision;
        if (this.#snapshotCache?.revision !== revision) {
            this.#snapshotCache = { revision, json: JSON.stringify({ revision, data: this.readData() }) };
        }
        return this.#snapshotCache.json;
    }

    /** Calls `listener` with the new revision after every committed write; returns the unsubscribe function. */
    subscribe(listener: Listener): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    updateEvent(event: EventInfo): number {
        return this.#write(() => this.setSetting(SETTING_EVENT, JSON.stringify(event)));
    }

    insert<T extends object>(collection: Collection<T>, item: T): number {
        return this.#write(() => this.#insertRow(collection, item), collection.messages);
    }

    /** Replaces the item stored under `key`; the item may carry a new key if the collection allows renames. */
    update<T extends object>(collection: Collection<T>, key: string, item: T): number {
        return this.#write(() => {
            const { changes } = this.db.update(collection.table).set(collection.toRow(item)).where(eq(collection.key, key)).run();
            if (changes === 0) {
                throw notFound();
            }
        }, collection.messages);
    }

    upsert<T extends object>(collection: Collection<T>, item: T): number {
        return this.#write(() => {
            const row = collection.toRow(item);
            this.db.insert(collection.table).values(row).onConflictDoUpdate({ target: collection.key, set: row }).run();
        }, collection.messages);
    }

    remove<T extends object>(collection: Collection<T>, key: string): number {
        return this.#write(() => {
            const { changes } = this.db.delete(collection.table).where(eq(collection.key, key)).run();
            if (changes === 0) {
                throw notFound();
            }
        }, collection.messages, true);
    }

    removeFloor(id: Id): number {
        return this.#write(() => {
            const [{ floors }] = this.db.select({ floors: count() }).from(schema.floors).all();
            if (floors <= 1) {
                throw conflict("Die letzte Etage kann nicht gelöscht werden.");
            }
            const { changes } = this.db.delete(schema.floors).where(eq(schema.floors.id, id)).run();
            if (changes === 0) {
                throw notFound();
            }
        }, {}, true);
    }

    setScheduleEntry({ classId, timeSlotId, zoneId, type }: ScheduleChange): number {
        return this.#write(() => {
            const { scheduleEntries: entries } = schema;
            if (type) {
                this.db.insert(entries).values({ classId, timeSlotId, zoneId, type })
                    .onConflictDoUpdate({ target: [entries.classId, entries.timeSlotId, entries.zoneId], set: { type } }).run();
            } else {
                this.db.delete(entries).where(and(
                    eq(entries.classId, classId), eq(entries.timeSlotId, timeSlotId), eq(entries.zoneId, zoneId),
                )).run();
            }
        });
    }

    /** Replaces all content; logo URLs must already point to stored images. */
    replaceAll(data: AppData): number {
        return this.#write(() => {
            // Children first: zones with exhibitors and tracks with classes cannot be deleted (ON DELETE RESTRICT)
            const tables: SQLiteTable[] = [
                schema.scheduleEntries, schema.booths, schema.floorLabels, schema.floorShapes, schema.talks,
                schema.exhibitors, schema.rooms, schema.classes, schema.tracks, schema.timeSlots, schema.floors,
                schema.categories, schema.zones,
            ];
            for (const table of tables) {
                this.db.delete(table).run();
            }

            this.setSetting(SETTING_EVENT, JSON.stringify(data.event));
            const insertAll = <T extends object>(collection: Collection<T>, items: T[]) => {
                for (const item of items) {
                    this.#insertRow(collection, item);
                }
            };
            insertAll(collections.categories, data.categories);
            insertAll(collections.groups, data.groups);
            insertAll(collections.exhibitors, data.exhibitors);
            insertAll(collections.rooms, data.rooms);
            insertAll(collections.talks, data.talks);
            insertAll(collections.tracks, data.tracks);
            insertAll(collections.classes, data.classes);
            insertAll(collections.timeSlots, data.timeSlots);
            for (const { classId, timeSlotId, zoneId, type } of data.classSchedule) {
                this.db.insert(schema.scheduleEntries).values({ classId, timeSlotId, zoneId, type }).run();
            }
            for (const { booths, labels, shapes, ...floor } of data.floorPlan.floors) {
                this.#insertRow(collections.floors, floor);
                insertAll(collections.booths, booths.map((booth) => ({ ...booth, floorId: floor.id })));
                insertAll(collections.labels, labels.map((label) => ({ ...label, floorId: floor.id })));
                insertAll(collections.shapes, shapes.map((shape) => ({ ...shape, floorId: floor.id })));
            }
        });
    }

    /** Stores an image (deduplicated by content) and returns its public URL. */
    storeImage(data: Uint8Array, mime: string): string {
        const id = createHash("sha256").update(data).digest("hex");
        this.db.insert(schema.images).values({ id, mime, data: Buffer.from(data) }).onConflictDoNothing().run();
        return `${MEDIA_PREFIX}${id}`;
    }

    image(id: string): StoredImage | null {
        return this.db.select({ mime: schema.images.mime, data: schema.images.data })
            .from(schema.images).where(eq(schema.images.id, id)).get() ?? null;
    }

    /** Deletes images no longer referenced by the event or any exhibitor, e.g. replaced logos or abandoned uploads. */
    pruneImages(): void {
        const data = this.readData();
        const referenced = [data.event.logoUrl, ...data.exhibitors.map((exhibitor) => exhibitor.logoUrl)]
            .filter((url) => url?.startsWith(MEDIA_PREFIX))
            .map((url) => url!.slice(MEDIA_PREFIX.length));
        this.db.delete(schema.images).where(notInArray(schema.images.id, referenced)).run();
    }

    #insertRow<T extends object>(collection: Collection<T>, item: T): void {
        const row = collection.toRow(item);
        if (collection.positioned) {
            row.position = sql`(SELECT COALESCE(MAX(position), -1) + 1 FROM ${collection.table})`;
        }
        this.db.insert(collection.table).values(row).run();
    }

    #write(work: () => void, messages?: ConstraintMessages, deleting = false): number {
        let revision = 0;
        try {
            this.db.transaction(() => {
                work();
                revision = this.revision + 1;
                this.setSetting(SETTING_REVISION, String(revision));
            }, { behavior: "immediate" });
        } catch (cause) {
            throw constraintError(cause, messages, deleting) ?? cause;
        }
        for (const listener of this.#listeners) {
            listener(revision);
        }
        return revision;
    }
}
