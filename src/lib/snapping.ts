// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { Segment } from "./geometry.ts";
import { type Floor, type Id, isRectShape } from "./types.ts";

export const SNAP_THRESHOLD = 10;
const AXIS_SNAP_DEGREES = 15;
const SHIFT_RASTER = Math.PI / 4;

export type SnapGuide = Segment;

export interface SnapTargets {
    x: number[];
    y: number[];
}

export type SnapExclusion = { kind: "booth" | "shape"; id: Id } | null;

/** Edges and centers of all boxes on the floor, except the one being dragged. */
export function boxSnapTargets(floor: Floor, exclude: SnapExclusion): SnapTargets {
    const x: number[] = [];
    const y: number[] = [];

    for (const booth of floor.booths) {
        if (exclude?.kind === "booth" && booth.exhibitorId === exclude.id) {
            continue;
        }
        x.push(booth.x, booth.x + booth.width, booth.x + booth.width / 2);
        y.push(booth.y, booth.y + booth.height, booth.y + booth.height / 2);
    }

    for (const shape of floor.shapes.filter(isRectShape)) {
        if (exclude?.kind === "shape" && shape.id === exclude.id) {
            continue;
        }
        x.push(shape.x, shape.x + shape.width, shape.x + shape.width / 2);
        y.push(shape.y, shape.y + shape.height, shape.y + shape.height / 2);
    }

    return { x, y };
}

function nearestTarget(edges: number[], targets: number[]): { delta: number; target: number } | null {
    let best: { delta: number; target: number } | null = null;

    for (const edge of edges) {
        for (const target of targets) {
            const delta = target - edge;
            if (!best || Math.abs(delta) < Math.abs(best.delta)) {
                best = { delta, target };
            }
        }
    }

    return best && Math.abs(best.delta) <= SNAP_THRESHOLD ? best : null;
}

export interface SnappedBox {
    x: number;
    y: number;
    guides: SnapGuide[];
}

export function snapBox(
    box: { x: number; y: number; width: number; height: number },
    targets: SnapTargets,
    floor: { width: number; height: number },
): SnappedBox {
    const guides: SnapGuide[] = [];
    let { x, y } = box;

    const horizontal = nearestTarget([box.x, box.x + box.width, box.x + box.width / 2], targets.x);
    if (horizontal) {
        x = box.x + horizontal.delta;
        guides.push({ x1: horizontal.target, y1: 0, x2: horizontal.target, y2: floor.height });
    }

    const vertical = nearestTarget([box.y, box.y + box.height, box.y + box.height / 2], targets.y);
    if (vertical) {
        y = box.y + vertical.delta;
        guides.push({ x1: 0, y1: vertical.target, x2: floor.width, y2: vertical.target });
    }

    return { x, y, guides };
}

// Without Shift only the main axes snap, so free angles stay possible
export function snapLineAngle(segment: Segment, shiftKey: boolean): { x2: number; y2: number } {
    const { x1, y1, x2, y2 } = segment;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < 1) {
        return { x2, y2 };
    }

    const angle = Math.atan2(dy, dx);
    const project = (radians: number) => ({
        x2: x1 + length * Math.cos(radians),
        y2: y1 + length * Math.sin(radians),
    });

    if (shiftKey) {
        return project(Math.round(angle / SHIFT_RASTER) * SHIFT_RASTER);
    }

    const degrees = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    for (const axis of [0, 90, 180, 270]) {
        if (Math.abs(((degrees - axis + 180) % 360) - 180) < AXIS_SNAP_DEGREES) {
            return project(axis * Math.PI / 180);
        }
    }

    return { x2, y2 };
}
