// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

/** Codes shared with Astro's `ActionError`, so domain errors map onto action errors 1:1. */
export type DomainErrorCode = "BAD_REQUEST" | "NOT_FOUND" | "CONFLICT";

/** An expected failure whose German message is safe to show to the client. */
export class DomainError extends Error {
    readonly code: DomainErrorCode;

    constructor(code: DomainErrorCode, message: string) {
        super(message);
        this.name = "DomainError";
        this.code = code;
    }
}

export const notFound = (message = "Eintrag nicht gefunden.") => new DomainError("NOT_FOUND", message);
export const conflict = (message: string) => new DomainError("CONFLICT", message);
export const badRequest = (message: string) => new DomainError("BAD_REQUEST", message);
