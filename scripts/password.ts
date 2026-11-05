// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

// Sets the admin password and signs out all admins: npm run password [-- <new password>]

import { rmSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { setAdminPassword } from "../src/server/auth.ts";
import { openDatabase } from "../src/server/db/client.ts";
import { DATABASE_PATH } from "../src/server/instance.ts";
import { Repository } from "../src/server/repository.ts";

const MIN_LENGTH = 8;
// Must match the session driver in astro.config.mjs
const SESSIONS_PATH = "data/sessions";

let password = process.argv[2];
if (!password) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    password = await prompt.question("New admin password: ");
    prompt.close();
}

if (password.length < MIN_LENGTH) {
    console.error(`The password needs at least ${MIN_LENGTH} characters.`);
    process.exit(1);
}

setAdminPassword(new Repository(openDatabase(DATABASE_PATH)), password);
rmSync(SESSIONS_PATH, { recursive: true, force: true });
console.log(`Admin password changed in ${DATABASE_PATH}; all sessions were signed out.`);
