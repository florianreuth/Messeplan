// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { Point } from "../../../lib/geometry.ts";
import type { Id } from "../../../lib/types.ts";

export const ARROW_COLORS = ["#475569", "#1e293b", "#2563eb", "#ef4444", "#16a34a", "#f97316", "#8b5cf6"];
export const STROKE_WIDTHS = [2, 3, 5, 8];

export const RECT_DEFAULTS = {
    fill: "#e2e8f0",
    stroke: "#94a3b8",
    strokeWidth: 1.5,
    fontSize: 13,
    textColor: "#475569",
} as const;

export const LABEL_DEFAULTS = {
    fontSize: 14,
    color: "#475569",
} as const;

export const DEFAULT_STROKE_COLOR = "#475569";
export const DEFAULT_STROKE_WIDTH = 3;
export const MIN_SHAPE_SIZE = 20;
export const MIN_DRAWN_LINE_LENGTH = 15;
export const MIN_DRAWN_RECT_SIZE = 10;
export const MIN_FLOOR_SIZE = { width: 400, height: 300 };

export type EditorTool = "select" | "rect" | "arrow" | "line" | "label";
export type SelectionKind = "booth" | "label" | "shape";

export interface Selection {
    kind: SelectionKind;
    id: Id;
}

export type DragState =
    | { kind: "booth"; id: Id; start: Point; origin: Point }
    | { kind: "label"; id: Id; start: Point; origin: Point }
    | { kind: "rect-shape"; id: Id; start: Point; origin: Point }
    | { kind: "linear-shape"; id: Id; start: Point; origin: { x1: number; y1: number; x2: number; y2: number } }
    | { kind: "booth-resize"; id: Id; start: Point; size: { width: number; height: number } }
    | { kind: "rect-resize"; id: Id; start: Point; size: { width: number; height: number } };

export interface LinePreview {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    tool: "arrow" | "line";
}

export interface RectPreview {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Turns a rectangle dragged in any direction into one with positive width and height. */
export function normalizeRect(preview: RectPreview): RectPreview {
    return {
        x: preview.width < 0 ? preview.x + preview.width : preview.x,
        y: preview.height < 0 ? preview.y + preview.height : preview.y,
        width: Math.abs(preview.width),
        height: Math.abs(preview.height),
    };
}
