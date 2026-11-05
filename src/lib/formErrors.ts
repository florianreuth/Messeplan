// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { z } from "zod";

export type FieldErrors = Record<string, string>;

export interface ErrorTexts {
    /** Used instead of zod's generic text when a required field is empty. */
    required?: Record<string, string>;
    /** Used for any problem of the field, where the form has a more specific wording. */
    invalid?: Record<string, string>;
}

function isEmpty(value: unknown): boolean {
    return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

/** Validates `value` with `schema` and returns the first German message per top-level field (empty when valid). */
export function fieldErrors(schema: z.ZodType, value: object, texts: ErrorTexts = {}): FieldErrors {
    const result = schema.safeParse(value);
    if (result.success) {
        return {};
    }

    const fields = value as Record<string, unknown>;
    const { required = {}, invalid = {} } = texts;
    const errors: FieldErrors = {};
    for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (errors[field]) {
            continue;
        }
        errors[field] = (isEmpty(fields[field]) ? required[field] : undefined) ?? invalid[field] ?? issue.message;
    }
    return errors;
}

/** Messages of fields the form has no error slot for, so they can still be shown. */
export function otherErrors(errors: FieldErrors, shown: string[]): string {
    return Object.entries(errors).filter(([field]) => !shown.includes(field)).map(([, message]) => message).join(" ");
}

/** The first message, for small dialogs that show a single error line. */
export function firstError(errors: FieldErrors): string | null {
    return Object.values(errors)[0] ?? null;
}
