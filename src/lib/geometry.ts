// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

export interface Point {
    x: number;
    y: number;
}

export interface Segment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const ARROW_HEAD_MAX = 18;
const ARROW_HEAD_RATIO = 0.35;
const ARROW_HEAD_ANGLE = Math.PI / 6;
const MIN_ARROW_LENGTH = 2;

export interface ArrowHead {
    lineEnd: Point;
    left: Point;
    right: Point;
}

export function segmentLength({ x1, y1, x2, y2 }: Segment): number {
    return Math.hypot(x2 - x1, y2 - y1);
}

/** Returns `null` for segments too short to carry a visible head. */
export function arrowHead(segment: Segment): ArrowHead | null {
    const { x1, y1, x2, y2 } = segment;
    const length = segmentLength(segment);
    if (length < MIN_ARROW_LENGTH) {
        return null;
    }

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = Math.min(ARROW_HEAD_MAX, length * ARROW_HEAD_RATIO);
    const pointAt = (offset: number): Point => ({
        x: x2 - headLength * Math.cos(angle + offset),
        y: y2 - headLength * Math.sin(angle + offset),
    });

    return {
        lineEnd: pointAt(0),
        left: pointAt(-ARROW_HEAD_ANGLE),
        right: pointAt(ARROW_HEAD_ANGLE),
    };
}
