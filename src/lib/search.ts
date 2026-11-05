// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

export function normalizeQuery(value: string): string {
    return value.trim().toLowerCase();
}

export function matchesQuery(query: string, fields: Array<string | number | undefined | null>): boolean {
    if (!query) {
        return true;
    }
    return fields.some((field) => field != null && String(field).toLowerCase().includes(query));
}

export function groupBy<T>(items: T[], keyOf: (item: T) => string): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
        (groups[keyOf(item)] ??= []).push(item);
    }
    return groups;
}

export function countBy<T>(items: T[], keyOf: (item: T) => string | undefined): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
        const key = keyOf(item);
        if (key) {
            counts[key] = (counts[key] ?? 0) + 1;
        }
    }
    return counts;
}
