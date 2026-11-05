// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Repository } from "./repository.ts";

const SETTING_PASSWORD_HASH = "adminPasswordHash";
const SCHEME = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const GENERATED_PASSWORD_BYTES = 12;

export function hashPassword(password: string): string {
    const salt = randomBytes(SALT_BYTES);
    const key = scryptSync(password, salt, KEY_BYTES);
    return [SCHEME, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
    const [scheme, salt, key] = stored.split("$");
    if (scheme !== SCHEME || !salt || !key) {
        return false;
    }
    const expected = Buffer.from(key, "base64url");
    const actual = scryptSync(password, Buffer.from(salt, "base64url"), expected.length);
    return timingSafeEqual(actual, expected);
}

export function setAdminPassword(repository: Repository, password: string): void {
    repository.setSetting(SETTING_PASSWORD_HASH, hashPassword(password));
}

export function adminPasswordMatches(repository: Repository, password: string): boolean {
    const stored = repository.getSetting(SETTING_PASSWORD_HASH);
    return stored !== null && verifyPassword(password, stored);
}

/** Stores `ADMIN_PASSWORD` or a random password if none is set; returns a generated one so it can be shown once. */
export function ensureAdminPassword(repository: Repository): string | null {
    if (repository.getSetting(SETTING_PASSWORD_HASH) !== null) {
        return null;
    }
    const password = process.env.ADMIN_PASSWORD || randomBytes(GENERATED_PASSWORD_BYTES).toString("base64url");
    setAdminPassword(repository, password);
    return process.env.ADMIN_PASSWORD ? null : password;
}
