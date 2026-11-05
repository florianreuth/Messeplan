// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

// Creates a fresh database with known content for the end-to-end tests; run before the server starts

import { rmSync } from "node:fs";
import { dirname } from "node:path";
import { setAdminPassword } from "../src/server/auth.ts";
import { collections } from "../src/server/collections.ts";
import { openDatabase } from "../src/server/db/client.ts";
import { DATABASE_PATH } from "../src/server/instance.ts";
import { Repository } from "../src/server/repository.ts";
import { ADMIN_PASSWORD } from "./fixtures.ts";

rmSync(dirname(DATABASE_PATH), { recursive: true, force: true });

const repository = new Repository(openDatabase(DATABASE_PATH));
repository.seedIfEmpty();
setAdminPassword(repository, ADMIN_PASSWORD);

repository.insert(collections.exhibitors, {
    id: "A1",
    name: "Muster GmbH",
    groupId: "A",
    categoryId: "unternehmen",
    standNumber: 1,
    description: "Ausbildung im Handwerk",
});
repository.insert(collections.exhibitors, { id: "B1", name: "Hochschule Beispielstadt", groupId: "B", standNumber: 1 });
repository.upsert(collections.booths, { exhibitorId: "A1", floorId: "eg", x: 100, y: 100, width: 80, height: 60 });
repository.upsert(collections.booths, { exhibitorId: "B1", floorId: "eg", x: 600, y: 400, width: 80, height: 60 });
repository.insert(collections.classes, { id: "5aG", track: "G", year: 5, section: "a", studentCount: 28, teachers: ["Müller"] });
repository.setScheduleEntry({ classId: "5aG", timeSlotId: "ts1", zoneId: "A", type: "visit" });
