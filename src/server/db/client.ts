// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Sqlite from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema.ts";

export type Database = BetterSQLite3Database<typeof schema>;

export const IN_MEMORY = ":memory:";

// Resolved from the working directory, because the built server no longer lives next to the sources
const MIGRATIONS_FOLDER = process.env.MIGRATIONS_PATH || join(process.cwd(), "drizzle");

/** Opens (and creates) the database at `path` and applies pending migrations. */
export function openDatabase(path: string): Database {
    if (path !== IN_MEMORY) {
        mkdirSync(dirname(path), { recursive: true });
    }
    const sqlite = new Sqlite(path);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("synchronous = NORMAL");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle({ client: sqlite, schema, casing: "snake_case" });
    migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    return db;
}
