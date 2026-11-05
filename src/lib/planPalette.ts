// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

// Plan colors come from the data and are chosen for a light background. In dark mode the neutral tones are
// replaced, deliberately chosen custom colors stay but are faded. Both variants are emitted as CSS custom
// properties and picked by the `.plan-fill`/`.plan-stroke` classes, so server-rendered plans already match the theme.
const DARK_NEUTRALS = new Map([
    ["#e2e8f0", "#2c2c30"],
    ["#94a3b8", "#4a4a4f"],
    ["#475569", "#a3a3a3"],
    ["#f8fafc", "#1c1c1f"],
    ["#ffffff", "#1c1c1f"],
]);

const CUSTOM_COLOR_DARK_OPACITY = 0.35;
const DARK_LABEL_COLOR = "#ffffff";

export const DEFAULT_LABEL_COLOR = "#475569";
export const DEFAULT_SHAPE_COLOR = "#475569";
export const DEFAULT_RECT_FILL = "#e2e8f0";
export const DEFAULT_RECT_STROKE = "#94a3b8";

function darkVariant(color: string): string {
    return DARK_NEUTRALS.get(color.toLowerCase()) ?? color;
}

function isNeutral(color: string): boolean {
    return DARK_NEUTRALS.has(color.toLowerCase());
}

/** Style for an area with class `plan-fill`; custom colors are faded in dark mode. */
export function areaFillVars(color: string | undefined, fallback: string): string {
    const value = color || fallback;
    const opacity = isNeutral(value) ? 1 : CUSTOM_COLOR_DARK_OPACITY;
    return `--fill-light: ${value}; --fill-dark: ${darkVariant(value)}; --fill-dark-opacity: ${opacity}`;
}

/** Style for a solid shape with class `plan-fill`, e.g. an arrow head matching its line. */
export function solidFillVars(color: string | undefined, fallback: string): string {
    const value = color || fallback;
    return `--fill-light: ${value}; --fill-dark: ${darkVariant(value)}`;
}

/** Style for an element with class `plan-stroke`. */
export function strokeVars(color: string | undefined, fallback: string): string {
    const value = color || fallback;
    return `--stroke-light: ${value}; --stroke-dark: ${darkVariant(value)}`;
}

/** Style for text with class `plan-fill`; labels are always white in dark mode. */
export function labelVars(color?: string): string {
    return `--fill-light: ${color || DEFAULT_LABEL_COLOR}; --fill-dark: ${DARK_LABEL_COLOR}`;
}
