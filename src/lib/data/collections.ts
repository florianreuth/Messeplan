// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { Id, TimeSlot } from "../types.ts";

export function byTimeSlotOrder(a: TimeSlot, b: TimeSlot): number {
    return a.start.localeCompare(b.start) || a.end.localeCompare(b.end);
}

/** The id of the schedule entry for one class, time slot and zone. */
export function scheduleEntryId(classId: Id, timeSlotId: Id, zoneId: Id): Id {
    return `${classId}:${timeSlotId}:${zoneId}`;
}
