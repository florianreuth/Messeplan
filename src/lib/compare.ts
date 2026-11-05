// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

interface Timed {
    startTime?: string;
}

interface Standing {
    groupId?: string;
    standNumber?: number;
    name: string;
}

export function byStartTime(a: Timed, b: Timed): number {
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
}

export function byStandNumber(a: Standing, b: Standing): number {
    return (a.standNumber ?? 0) - (b.standNumber ?? 0) || a.name.localeCompare(b.name);
}

export function byGroupAndStand(a: Standing, b: Standing): number {
    return (a.groupId ?? "").localeCompare(b.groupId ?? "") || (a.standNumber ?? 0) - (b.standNumber ?? 0);
}
