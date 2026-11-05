// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { actions, isActionError, isInputError } from "astro:actions";
import type { Snapshot } from "../types.ts";

export const BACKUP_URL = "/api/backup";
const SNAPSHOT_URL = "/api/data";
const UNREACHABLE = "Server nicht erreichbar.";

/** A German message for any failure of an action call. */
export function errorMessage(cause: unknown): string {
    if (isInputError(cause)) {
        const [issue] = cause.issues;
        return issue ? `${issue.path.join(".")}: ${issue.message}` : cause.message;
    }
    if (isActionError(cause)) {
        return cause.message;
    }
    // fetch reports network failures as TypeError; other errors carry our own German messages
    return cause instanceof Error && !(cause instanceof TypeError) ? cause.message : UNREACHABLE;
}

export function isSessionExpired(cause: unknown): boolean {
    return isActionError(cause) && cause.code === "UNAUTHORIZED";
}

// A plain GET instead of an action: every open page reloads it after a change, so it uses HTTP caching (ETag)
export async function fetchSnapshot(): Promise<Snapshot> {
    const response = await fetch(SNAPSHOT_URL, { headers: { accept: "application/json" } });
    if (!response.ok) {
        throw new Error(UNREACHABLE);
    }
    return await response.json() as Snapshot;
}

function fileForm(file: File): FormData {
    const form = new FormData();
    form.append("file", file);
    return form;
}

/** Uploads an image and returns its URL for a logo field; `maxBytes` is checked before uploading. */
export async function uploadImage(file: File, maxBytes: number): Promise<string> {
    if (file.size > maxBytes) {
        throw new Error(`Datei zu groß (max. ${Math.round(maxBytes / 1024)} KB).`);
    }
    const { url } = await actions.images.upload.orThrow(fileForm(file));
    return url;
}

export async function restoreBackup(file: File): Promise<Snapshot> {
    return actions.backup.restore.orThrow(fileForm(file));
}

export async function login(password: string): Promise<void> {
    await actions.session.login.orThrow({ password });
}

export async function logout(): Promise<void> {
    await actions.session.logout();
}
