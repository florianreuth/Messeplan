// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { ScheduleEntryType } from "./types.ts";

export interface ScheduleTypeConfig {
    label: string;
    color: string;
}

// A visit is the normal case and stays neutral, so only the special entries stand out
export const SCHEDULE_TYPES: Record<ScheduleEntryType, ScheduleTypeConfig> = {
    visit: { label: "Besuch", color: "#737373" },
    reflection: { label: "Reflexion", color: "#bd7a12" },
    conversation: { label: "Gespräche", color: "#1d4ed8" },
    start: { label: "Start", color: "#047857" },
    break: { label: "Pause", color: "#a3a3a3" },
};

export function scheduleType(type?: ScheduleEntryType): ScheduleTypeConfig {
    return (type && SCHEDULE_TYPES[type]) || SCHEDULE_TYPES.visit;
}

export function isScheduleType(value: string): value is ScheduleEntryType {
    return Object.hasOwn(SCHEDULE_TYPES, value);
}
