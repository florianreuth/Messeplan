// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { AppData, Category, Floor, Group, TimeSlot, Track } from "../types.ts";

export const DEFAULT_EVENT_NAME = "Messe";
export const DEFAULT_FLOOR_SIZE = { width: 1000, height: 700 } as const;
export const DEFAULT_BOOTH_SIZE = { width: 80, height: 60 } as const;
export const DEFAULT_FLOOR_ID = "eg";
export const NEW_FLOOR_LABEL = "Neues Stockwerk";

export function createFloor(id: string, label: string): Floor {
    return { id, label, ...DEFAULT_FLOOR_SIZE, booths: [], labels: [], shapes: [] };
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: "unternehmen", label: "Unternehmen", color: "#3B82F6" },
    { id: "oeffentlich", label: "Öffentl. Dienst", color: "#10B981" },
    { id: "hochschule", label: "Hochschulen", color: "#8B5CF6" },
];

const DEFAULT_GROUPS: Group[] = [
    { id: "A", label: "Bereich A", color: "#EF4444" },
    { id: "B", label: "Bereich B", color: "#F97316" },
    { id: "C", label: "Bereich C", color: "#EAB308" },
    { id: "D", label: "Bereich D", color: "#22C55E" },
    { id: "E", label: "Bereich E", color: "#14B8A6" },
    { id: "F", label: "Bereich F", color: "#3B82F6" },
    { id: "G", label: "Bereich G", color: "#8B5CF6" },
    { id: "H", label: "Bereich H", color: "#EC4899" },
];

const DEFAULT_TRACKS: Track[] = [
    { id: "G", label: "Gymnasialzweig", firstYear: 5, lastYear: 10, sections: true },
    { id: "R", label: "Realschulzweig", firstYear: 5, lastYear: 10, sections: true },
    { id: "H", label: "Hauptschulzweig", firstYear: 5, lastYear: 10, sections: true },
    { id: "OS", label: "Gymnasiale Oberstufe", firstYear: 11, lastYear: 13, sections: false },
];

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
    { id: "ts0", start: "07:30", end: "08:20", label: "Gemeinsamer Start" },
    { id: "ts1", start: "08:20", end: "08:50" },
    { id: "ts2", start: "08:50", end: "09:20" },
    { id: "ts3", start: "09:20", end: "09:50" },
    { id: "ts4", start: "09:50", end: "10:20" },
    { id: "ts5", start: "10:20", end: "10:50" },
    { id: "ts6", start: "10:50", end: "11:20" },
    { id: "ts7", start: "11:20", end: "11:50" },
    { id: "ts8", start: "11:50", end: "12:20" },
    { id: "ts9", start: "12:20", end: "12:45", label: "Abschluss" },
];

/** The content of a freshly installed instance. */
export function createDefaultData(): AppData {
    return {
        event: { name: DEFAULT_EVENT_NAME },
        categories: structuredClone(DEFAULT_CATEGORIES),
        groups: structuredClone(DEFAULT_GROUPS),
        exhibitors: [],
        rooms: [],
        talks: [],
        tracks: structuredClone(DEFAULT_TRACKS),
        classes: [],
        timeSlots: structuredClone(DEFAULT_TIME_SLOTS),
        classSchedule: [],
        floorPlan: { floors: [createFloor(DEFAULT_FLOOR_ID, "Erdgeschoss")] },
    };
}
