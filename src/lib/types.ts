// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

export type Id = string;

export interface Identifiable {
    id: Id;
}

export interface EventInfo {
    name: string;
    date?: string;
    logoUrl?: string;
    description?: string;
    imprintUrl?: string;
}

export interface Category extends Identifiable {
    label: string;
    color: string;
}

/** A zone ("Bereich") of the fair; exhibitors and class visits are assigned to zones. */
export interface Group extends Identifiable {
    label: string;
    color: string;
}

/** The id doubles as the stand id shown to visitors (e.g. "A3") and may be renamed. */
export interface Exhibitor extends Identifiable {
    name: string;
    groupId?: Id;
    categoryId?: Id;
    standNumber?: number;
    description?: string;
    website?: string;
    locationNote?: string;
    contact?: string;
    contactEmail?: string;
    logoUrl?: string;
}

export interface Room extends Identifiable {
    name: string;
    capacity?: number;
    floor?: string;
}

export interface Talk extends Identifiable {
    exhibitorId?: Id;
    roomId?: Id;
    startTime?: string;
    durationMinutes?: number;
    format?: string;
    topic?: string;
    speakerName?: string;
    speakerRole?: string;
    notes?: string;
}

/** A school track ("Zweig"); the id is its short code, which is part of every class id (the "G" in "5aG"). */
export interface Track extends Identifiable {
    label: string;
    firstYear: number;
    lastYear: number;
    /** Whether a year has several classes told apart by letters (5a, 5b); otherwise one class per year. */
    sections: boolean;
}

export interface SchoolClass extends Identifiable {
    track: string;
    year: number;
    section?: string;
    studentCount?: number;
    teachers?: string[];
    notes?: string;
}

/** Times are "HH:MM" strings. */
export interface TimeSlot extends Identifiable {
    start: string;
    end: string;
    label?: string;
}

export const SCHEDULE_ENTRY_TYPES = ["visit", "reflection", "conversation", "start", "break"] as const;

export type ScheduleEntryType = (typeof SCHEDULE_ENTRY_TYPES)[number];

/** At most one entry exists per class, time slot and zone; the id is derived from that triple. */
export interface ClassScheduleEntry extends Identifiable {
    classId: Id;
    timeSlotId: Id;
    zoneId: Id;
    type: ScheduleEntryType;
}

/** Coordinates and sizes are in floor units (the floor's viewBox). */
export interface Booth {
    exhibitorId: Id;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FloorLabel extends Identifiable {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    color?: string;
}

interface ShapeBase extends Identifiable {
    color?: string;
    strokeWidth?: number;
}

export interface LineShape extends ShapeBase {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ArrowShape extends ShapeBase {
    type: "arrow";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface RectShape extends Identifiable {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    label?: string;
    fontSize?: number;
    textColor?: string;
}

export type FloorShape = LineShape | ArrowShape | RectShape;
export type ShapeType = FloorShape["type"];
export type LinearShape = LineShape | ArrowShape;

export function isLinearShape(shape: FloorShape): shape is LinearShape {
    return shape.type === "line" || shape.type === "arrow";
}

export function isRectShape(shape: FloorShape): shape is RectShape {
    return shape.type === "rect";
}

export interface Floor extends Identifiable {
    label: string;
    width: number;
    height: number;
    booths: Booth[];
    labels: FloorLabel[];
    shapes: FloorShape[];
}

export interface FloorPlan {
    floors: Floor[];
}

/** The complete fair content; also the JSON backup format. */
export interface AppData {
    event: EventInfo;
    categories: Category[];
    groups: Group[];
    exhibitors: Exhibitor[];
    rooms: Room[];
    talks: Talk[];
    tracks: Track[];
    classes: SchoolClass[];
    timeSlots: TimeSlot[];
    classSchedule: ClassScheduleEntry[];
    floorPlan: FloorPlan;
}

/** The data together with the server revision it was read at. */
export interface Snapshot {
    revision: number;
    data: AppData;
}

export interface CollectionTypes {
    categories: Category;
    groups: Group;
    exhibitors: Exhibitor;
    rooms: Room;
    talks: Talk;
    tracks: Track;
    classes: SchoolClass;
    timeSlots: TimeSlot;
}

export type CollectionKey = keyof CollectionTypes;

export type CollectionItem<K extends CollectionKey> = CollectionTypes[K];

// Distributes over unions such as FloorShape, otherwise only the shared fields would remain
export type NewItem<T extends Identifiable> = T extends unknown ? Omit<T, "id"> & { id?: Id } : never;

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "session_expired";
