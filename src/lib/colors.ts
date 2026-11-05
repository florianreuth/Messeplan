// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

export const DEFAULT_GROUP_COLOR = "#64748b";

/** Style for an element with class `tint`, which derives light and dark badge colors from one hex color. */
export function tintStyle(hex: string): string {
    return `--tint: ${hex}`;
}
