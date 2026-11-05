// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { SchoolClass, Track } from "./types.ts";

export function classLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.year}${schoolClass.section ?? ""}${schoolClass.track}`;
}

export function byClassOrder(a: SchoolClass, b: SchoolClass): number {
    return a.year - b.year
        || a.track.localeCompare(b.track)
        || (a.section ?? "").localeCompare(b.section ?? "");
}

export interface YearGroup {
    year: number;
    classes: SchoolClass[];
}

export function groupClassesByYear(classes: SchoolClass[]): YearGroup[] {
    const groups: YearGroup[] = [];
    for (const schoolClass of [...classes].sort(byClassOrder)) {
        const bucket = groups.find((group) => group.year === schoolClass.year);
        if (bucket) {
            bucket.classes.push(schoolClass);
        } else {
            groups.push({ year: schoolClass.year, classes: [schoolClass] });
        }
    }
    return groups;
}

export function trackYears(track: Track): number[] {
    return Array.from({ length: Math.max(0, track.lastYear - track.firstYear + 1) }, (_, index) => track.firstYear + index);
}

// The admin area spells out tracks without class letters (e.g. an upper school), the short form would be ambiguous
export function classDisplayName(schoolClass: SchoolClass, track: Track | undefined): string {
    return track && !track.sections ? `${track.label} ${schoolClass.year}` : classLabel(schoolClass);
}

/** Derives the id of a new class, e.g. "5aG", or "11OS" for a track without class letters. */
export function classIdFor(track: Track, year: number, section: string): string {
    return track.sections ? `${year}${section}${track.id}` : `${year}${track.id}`;
}
