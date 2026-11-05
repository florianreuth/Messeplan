// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { RateLimiterMemory } from "rate-limiter-flexible";
import { ensureAdminPassword } from "./auth.ts";
import { openDatabase } from "./db/client.ts";
import { Repository } from "./repository.ts";

export const DATABASE_PATH = process.env.DATABASE_PATH || "data/messeplan.db";

interface Services {
    repository: Repository;
    /** Failed logins per client address: 10 per 15 minutes. */
    loginLimiter: RateLimiterMemory;
}

// Kept on globalThis so the dev server's module reloads reuse one connection instead of opening new ones
const holder = globalThis as typeof globalThis & { messeplan?: Services };

function start(): Services {
    const repository = new Repository(openDatabase(DATABASE_PATH));
    repository.seedIfEmpty();
    repository.pruneImages();

    const password = ensureAdminPassword(repository);
    console.log(`Messeplan database: ${DATABASE_PATH}`);
    if (password) {
        console.log(`Generated admin password: ${password}`);
        console.log("Change it with \"npm run password\".");
    }
    return { repository, loginLimiter: new RateLimiterMemory({ points: 10, duration: 15 * 60 }) };
}

/** The process-wide services, opened on first use. */
export function services(): Services {
    return holder.messeplan ??= start();
}
