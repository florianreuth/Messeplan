// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { z } from "astro/zod";
import type { SQL } from "drizzle-orm";
import { asc, sql } from "drizzle-orm";
import type { AnySQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Booth, Category, Exhibitor, FloorLabel, FloorShape, Group, Room, SchoolClass, Talk, TimeSlot, Track } from "../lib/types.ts";
import * as schema from "./db/schema.ts";
import * as validation from "../lib/schemas.ts";

/** Floor items are nested in their floor in the domain model but stored with a reference to it. */
export type OnFloor<T> = T & { floorId: string };

export type FloorRecord = { id: string; label: string; width: number; height: number };

export type Row = Record<string, unknown>;

/** German messages for constraint violations, which surface as CONFLICT errors. */
export interface ConstraintMessages {
    duplicate?: string;
    unknownReference?: string;
    inUse?: string;
}

/** Everything the repository and the actions need to know about one stored entity type. */
export interface Collection<T extends object = object> {
    table: SQLiteTable;
    key: AnySQLiteColumn;
    keyOf(item: T): string;
    schema: z.ZodType<T>;
    orderBy: SQL[];
    /** Keeps insertion order in a `position` column (lists the admins sort by hand). */
    positioned?: boolean;
    /** Whether an update may change the key; dependent rows follow via ON UPDATE CASCADE. */
    renamable?: boolean;
    messages?: ConstraintMessages;
    toRow(item: T): Row;
    fromRow(row: Row): T;
}

// Domain types use absent properties where the database has NULL
function withoutNulls<T>(row: Row): T {
    return Object.fromEntries(Object.entries(row).filter(([column, value]) => value !== null && column !== "position")) as T;
}

function collection<T extends object>(definition: Omit<Collection<T>, "keyOf" | "toRow" | "fromRow" | "orderBy"> &
    Partial<Pick<Collection<T>, "toRow" | "fromRow" | "orderBy">> & { keyProperty?: keyof T & string }): Collection<T> {
    const { keyProperty = "id" as keyof T & string, ...rest } = definition;
    return {
        keyOf: (item) => String(item[keyProperty]),
        toRow: (item) => ({ ...item }),
        fromRow: withoutNulls<T>,
        orderBy: [definition.positioned ? asc(sql`position`) : asc(sql`rowid`)],
        ...rest,
    } as Collection<T>;
}

export const collections = {
    categories: collection<Category>({
        table: schema.categories,
        key: schema.categories.id,
        schema: validation.categorySchema,
        positioned: true,
    }),
    groups: collection<Group>({
        table: schema.zones,
        key: schema.zones.id,
        schema: validation.groupSchema,
        positioned: true,
        messages: {
            duplicate: "Diese Bereichs-ID ist bereits vergeben.",
            inUse: "Dem Bereich sind noch Aussteller zugeordnet. Bitte zuerst die Aussteller verschieben oder löschen.",
        },
    }),
    exhibitors: collection<Exhibitor>({
        table: schema.exhibitors,
        key: schema.exhibitors.id,
        schema: validation.exhibitorSchema,
        renamable: true,
        messages: { duplicate: "Diese Stand-ID ist bereits vergeben." },
    }),
    rooms: collection<Room>({ table: schema.rooms, key: schema.rooms.id, schema: validation.roomSchema }),
    talks: collection<Talk>({ table: schema.talks, key: schema.talks.id, schema: validation.talkSchema }),
    tracks: collection<Track>({
        table: schema.tracks,
        key: schema.tracks.id,
        schema: validation.trackSchema,
        positioned: true,
        messages: {
            duplicate: "Dieses Kürzel ist bereits vergeben.",
            inUse: "Dem Zweig sind noch Klassen zugeordnet. Bitte zuerst die Klassen löschen.",
        },
    }),
    classes: collection<SchoolClass>({
        table: schema.classes,
        key: schema.classes.id,
        schema: validation.classSchema,
        messages: { duplicate: "Diese Klasse existiert bereits.", unknownReference: "Diesen Zweig gibt es nicht." },
    }),
    timeSlots: collection<TimeSlot>({
        table: schema.timeSlots,
        key: schema.timeSlots.id,
        schema: validation.timeSlotSchema,
        orderBy: [asc(schema.timeSlots.start), asc(schema.timeSlots.end)],
    }),
    floors: collection<FloorRecord>({
        table: schema.floors,
        key: schema.floors.id,
        schema: validation.floorSchema,
        positioned: true,
    }),
    booths: collection<OnFloor<Booth>>({
        table: schema.booths,
        key: schema.booths.exhibitorId,
        keyProperty: "exhibitorId",
        schema: validation.boothSchema,
    }),
    labels: collection<OnFloor<FloorLabel>>({
        table: schema.floorLabels,
        key: schema.floorLabels.id,
        schema: validation.labelSchema,
    }),
    shapes: collection<OnFloor<FloorShape>>({
        table: schema.floorShapes,
        key: schema.floorShapes.id,
        schema: validation.shapeSchema as z.ZodType<OnFloor<FloorShape>>,
        toRow: ({ id, floorId, type, ...props }) => ({ id, floorId, type, props }),
        fromRow: ({ props, ...row }) => ({ ...withoutNulls(row), ...props as object }) as OnFloor<FloorShape>,
    }),
};

export type CollectionName = keyof typeof collections;
