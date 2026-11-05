// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import * as z from "zod";
import de from "zod/v4/locales/de.js";
import { SCHEDULE_ENTRY_TYPES } from "./types.ts";

// Only the German locale, so the client bundle does not ship all of them
z.config(de());

const MAX_COORDINATE = 100_000;

const key = z.string().trim().min(1).max(64);
const label = (max = 200) => z.string().trim().min(1).max(max);

// Forms send empty strings or null for cleared fields; they are stored as absent
const optionalText = (max = 500) => z.string().trim().max(max).nullish().transform((value) => value || undefined);
const optionalKey = optionalText(64);
const optionalCount = z.number().int().min(0).max(100_000).nullish().transform((value) => value ?? undefined);
const optionalPattern = (pattern: RegExp, message: string, max = 2000) =>
    optionalText(max).refine((value) => value === undefined || pattern.test(value), message);

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const color = z.string().regex(HEX_COLOR, "Ungültige Farbe");
const optionalColor = optionalPattern(HEX_COLOR, "Ungültige Farbe");
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Uhrzeit");
const coordinate = z.number().min(-MAX_COORDINATE).max(MAX_COORDINATE);
const extent = z.number().positive().max(MAX_COORDINATE);
const optionalExtent = extent.nullish().transform((value) => value ?? undefined);
const webUrl = optionalPattern(/^https?:\/\/\S+$/i, "Nur http- und https-Adressen sind erlaubt");
const email = optionalPattern(/^[^\s@]+@[^\s@]+$/, "Ungültige E-Mail-Adresse", 200);
// Logos are uploaded (/media/…) or external https images; backups carry them inline as data URLs
const imageUrl = optionalPattern(/^(\/media\/[0-9a-f]{64}|https?:\/\/\S+)$/i, "Ungültige Bildadresse");
const embeddedImageUrl = optionalPattern(/^(\/media\/[0-9a-f]{64}|https?:\/\/\S+|data:image\/[\w+.-]+;base64,\S+)$/i,
    "Ungültige Bildadresse", 4_000_000);

export const eventSchema = z.object({
    name: label(100),
    date: optionalText(100),
    logoUrl: imageUrl,
    description: optionalText(2000),
    imprintUrl: webUrl,
});

export const categorySchema = z.object({ id: key, label: label(100), color });

export const groupSchema = z.object({ id: key, label: label(100), color });

export const exhibitorSchema = z.object({
    id: key,
    name: label(),
    groupId: optionalKey,
    categoryId: optionalKey,
    standNumber: optionalCount,
    description: optionalText(4000),
    website: webUrl,
    locationNote: optionalText(),
    contact: optionalText(),
    contactEmail: email,
    logoUrl: imageUrl,
});

export const roomSchema = z.object({ id: key, name: label(), capacity: optionalCount, floor: optionalText(50) });

export const talkSchema = z.object({
    id: key,
    exhibitorId: optionalKey,
    roomId: optionalKey,
    startTime: clock.nullish().transform((value) => value || undefined),
    durationMinutes: optionalCount,
    format: optionalText(100),
    topic: optionalText(),
    speakerName: optionalText(200),
    speakerRole: optionalText(200),
    notes: optionalText(),
});

export const classSchema = z.object({
    id: key,
    track: label(10),
    year: z.number().int().min(1).max(13),
    section: optionalText(5),
    studentCount: optionalCount,
    teachers: z.array(label(100)).max(20).default([]),
    notes: optionalText(),
});

const schoolYear = z.number().int().min(1).max(13);

// The short code becomes part of every class id, so it stays a few letters or digits
export const trackSchema = z.object({
    id: z.string().trim().regex(/^[A-Za-z0-9]{1,4}$/, "Das Kürzel besteht aus 1–4 Buchstaben oder Ziffern."),
    label: label(100),
    firstYear: schoolYear,
    lastYear: schoolYear,
    sections: z.boolean(),
}).refine((track) => track.lastYear >= track.firstYear, { path: ["lastYear"], message: "Der letzte Jahrgang darf nicht vor dem ersten liegen." });

export const timeSlotSchema = z.object({ id: key, start: clock, end: clock, label: optionalText(200) });

export const floorSchema = z.object({ id: key, label: label(100), width: extent, height: extent });

const booth = z.object({ exhibitorId: key, x: coordinate, y: coordinate, width: extent, height: extent });

const floorLabel = z.object({
    id: key,
    text: label(),
    x: coordinate,
    y: coordinate,
    fontSize: optionalExtent,
    color: optionalColor,
});

const segment = {
    id: key,
    x1: coordinate,
    y1: coordinate,
    x2: coordinate,
    y2: coordinate,
    color: optionalColor,
    strokeWidth: optionalExtent,
};

const shapeVariants = [
    z.object({ type: z.literal("line"), ...segment }),
    z.object({ type: z.literal("arrow"), ...segment }),
    z.object({
        type: z.literal("rect"),
        id: key,
        x: coordinate,
        y: coordinate,
        width: extent,
        height: extent,
        fill: optionalColor,
        stroke: optionalColor,
        strokeWidth: optionalExtent,
        label: optionalText(200),
        fontSize: optionalExtent,
        textColor: optionalColor,
    }),
] as const;

// Floor items are written one by one with a reference to their floor, but nested in floors inside backups
const onFloor = { floorId: key };
export const boothSchema = booth.extend(onFloor);
export const labelSchema = floorLabel.extend(onFloor);
export const shapeSchema = z.discriminatedUnion("type", [
    shapeVariants[0].extend(onFloor),
    shapeVariants[1].extend(onFloor),
    shapeVariants[2].extend(onFloor),
]);

export const scheduleChangeSchema = z.object({
    classId: key,
    timeSlotId: key,
    zoneId: key,
    type: z.enum(SCHEDULE_ENTRY_TYPES).nullable(),
});

/** A complete backup as produced by the export, with logos inlined as data URLs. */
export const backupSchema = z.object({
    event: eventSchema.extend({ logoUrl: embeddedImageUrl }),
    categories: z.array(categorySchema),
    groups: z.array(groupSchema),
    exhibitors: z.array(exhibitorSchema.extend({ logoUrl: embeddedImageUrl })),
    rooms: z.array(roomSchema),
    talks: z.array(talkSchema),
    tracks: z.array(trackSchema),
    classes: z.array(classSchema),
    timeSlots: z.array(timeSlotSchema),
    classSchedule: z.array(scheduleChangeSchema.extend({ id: z.string(), type: z.enum(SCHEDULE_ENTRY_TYPES) })),
    floorPlan: z.object({
        floors: z.array(floorSchema.extend({
            booths: z.array(booth),
            labels: z.array(floorLabel),
            shapes: z.array(z.discriminatedUnion("type", shapeVariants)),
        })).min(1, "Mindestens eine Etage ist erforderlich."),
    }),
});

export const loginSchema = z.object({ password: z.string().min(1).max(200) });
