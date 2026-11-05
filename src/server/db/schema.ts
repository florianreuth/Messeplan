// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { blob, index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { ScheduleEntryType } from "../../lib/types.ts";

export const settings = sqliteTable("settings", {
    key: text().primaryKey(),
    value: text().notNull(),
});

export const categories = sqliteTable("categories", {
    id: text().primaryKey(),
    label: text().notNull(),
    color: text().notNull(),
    position: integer().notNull(),
});

// "groups" is an SQL keyword; the domain calls them zones ("Bereiche") anyway
export const zones = sqliteTable("zones", {
    id: text().primaryKey(),
    label: text().notNull(),
    color: text().notNull(),
    position: integer().notNull(),
});

export const exhibitors = sqliteTable("exhibitors", {
    id: text().primaryKey(),
    name: text().notNull(),
    groupId: text("zone_id").references(() => zones.id, { onUpdate: "cascade", onDelete: "restrict" }),
    categoryId: text("category_id").references(() => categories.id, { onUpdate: "cascade", onDelete: "set null" }),
    standNumber: integer("stand_number"),
    description: text(),
    website: text(),
    locationNote: text("location_note"),
    contact: text(),
    contactEmail: text("contact_email"),
    logoUrl: text("logo_url"),
}, (table) => [index("exhibitors_zone").on(table.groupId), index("exhibitors_category").on(table.categoryId)]);

export const rooms = sqliteTable("rooms", {
    id: text().primaryKey(),
    name: text().notNull(),
    capacity: integer(),
    floor: text(),
});

export const talks = sqliteTable("talks", {
    id: text().primaryKey(),
    exhibitorId: text("exhibitor_id").references(() => exhibitors.id, { onUpdate: "cascade", onDelete: "cascade" }),
    roomId: text("room_id").references(() => rooms.id, { onDelete: "set null" }),
    startTime: text("start_time"),
    durationMinutes: integer("duration_minutes"),
    format: text(),
    topic: text(),
    speakerName: text("speaker_name"),
    speakerRole: text("speaker_role"),
    notes: text(),
}, (table) => [index("talks_exhibitor").on(table.exhibitorId), index("talks_room").on(table.roomId)]);

export const tracks = sqliteTable("tracks", {
    id: text().primaryKey(),
    label: text().notNull(),
    firstYear: integer("first_year").notNull(),
    lastYear: integer("last_year").notNull(),
    sections: integer({ mode: "boolean" }).notNull(),
    position: integer().notNull(),
});

export const classes = sqliteTable("classes", {
    id: text().primaryKey(),
    track: text().notNull().references(() => tracks.id, { onUpdate: "cascade", onDelete: "restrict" }),
    year: integer().notNull(),
    section: text(),
    studentCount: integer("student_count"),
    teachers: text({ mode: "json" }).$type<string[]>().notNull().default([]),
    notes: text(),
}, (table) => [index("classes_track").on(table.track)]);

export const timeSlots = sqliteTable("time_slots", {
    id: text().primaryKey(),
    start: text("start_time").notNull(),
    end: text("end_time").notNull(),
    label: text(),
});

export const scheduleEntries = sqliteTable("schedule_entries", {
    classId: text("class_id").notNull().references(() => classes.id, { onUpdate: "cascade", onDelete: "cascade" }),
    timeSlotId: text("time_slot_id").notNull().references(() => timeSlots.id, { onDelete: "cascade" }),
    zoneId: text("zone_id").notNull().references(() => zones.id, { onUpdate: "cascade", onDelete: "cascade" }),
    type: text({ enum: ["visit", "reflection", "conversation", "start", "break"] }).$type<ScheduleEntryType>().notNull(),
}, (table) => [
    primaryKey({ columns: [table.classId, table.timeSlotId, table.zoneId] }),
    index("schedule_entries_time_slot").on(table.timeSlotId),
    index("schedule_entries_zone").on(table.zoneId),
]);

export const floors = sqliteTable("floors", {
    id: text().primaryKey(),
    label: text().notNull(),
    width: real().notNull(),
    height: real().notNull(),
    position: integer().notNull(),
});

export const booths = sqliteTable("booths", {
    exhibitorId: text("exhibitor_id").primaryKey().references(() => exhibitors.id, { onUpdate: "cascade", onDelete: "cascade" }),
    floorId: text("floor_id").notNull().references(() => floors.id, { onDelete: "cascade" }),
    x: real().notNull(),
    y: real().notNull(),
    width: real().notNull(),
    height: real().notNull(),
}, (table) => [index("booths_floor").on(table.floorId)]);

export const floorLabels = sqliteTable("floor_labels", {
    id: text().primaryKey(),
    floorId: text("floor_id").notNull().references(() => floors.id, { onDelete: "cascade" }),
    text: text().notNull(),
    x: real().notNull(),
    y: real().notNull(),
    fontSize: real("font_size"),
    color: text(),
}, (table) => [index("floor_labels_floor").on(table.floorId)]);

// Geometry and style differ per shape type and are only ever read as a whole, so they live in a JSON column
export const floorShapes = sqliteTable("floor_shapes", {
    id: text().primaryKey(),
    floorId: text("floor_id").notNull().references(() => floors.id, { onDelete: "cascade" }),
    type: text({ enum: ["line", "arrow", "rect"] }).notNull(),
    props: text({ mode: "json" }).$type<Record<string, unknown>>().notNull(),
}, (table) => [index("floor_shapes_floor").on(table.floorId)]);

// Content-addressed: the id is the SHA-256 of the data, so identical uploads are stored once
export const images = sqliteTable("images", {
    id: text().primaryKey(),
    mime: text().notNull(),
    data: blob({ mode: "buffer" }).notNull(),
});
