// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { Booth, Floor, FloorLabel, FloorPlan, FloorShape, Id } from "../types.ts";
import { DEFAULT_BOOTH_SIZE } from "./defaults.ts";

export type FloorItemKey = "labels" | "shapes";

export interface FloorItemTypes {
    labels: FloorLabel;
    shapes: FloorShape;
}

/** Mutates `plan` (an Immer draft): an exhibitor has at most one booth, so placing it removes it from other floors. */
export function placeBooth(plan: FloorPlan, floorId: Id, exhibitorId: Id, patch: Partial<Booth>): void {
    for (const floor of plan.floors) {
        const index = floor.booths.findIndex((booth) => booth.exhibitorId === exhibitorId);
        if (floor.id !== floorId) {
            if (index >= 0) {
                floor.booths.splice(index, 1);
            }
        } else if (index >= 0) {
            Object.assign(floor.booths[index], patch);
        } else {
            floor.booths.push({ x: 0, y: 0, ...DEFAULT_BOOTH_SIZE, ...patch, exhibitorId });
        }
    }
}

/** Mutates `plan` (an Immer draft). */
export function removeBooth(plan: FloorPlan, exhibitorId: Id): void {
    for (const floor of plan.floors) {
        const index = floor.booths.findIndex((booth) => booth.exhibitorId === exhibitorId);
        if (index >= 0) {
            floor.booths.splice(index, 1);
        }
    }
}

export function findBooth(plan: FloorPlan, exhibitorId: Id): { floor: Floor; booth: Booth } | null {
    for (const floor of plan.floors) {
        const booth = floor.booths.find((item) => item.exhibitorId === exhibitorId);
        if (booth) {
            return { floor, booth };
        }
    }
    return null;
}
