// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { Floor } from "./types.ts";

/** Floors worth showing to visitors, i.e. those with at least one booth, shape or label. */
export function contentFloors(floors: Floor[]): Floor[] {
    return floors.filter((floor) => floor.booths.length > 0 || floor.shapes.length > 0 || floor.labels.length > 0);
}
