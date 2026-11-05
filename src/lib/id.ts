// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import type { Id } from "./types.ts";

export function createId(): Id {
    return crypto.randomUUID();
}
