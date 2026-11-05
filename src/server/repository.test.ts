// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { createDefaultData } from "../lib/data/defaults.ts";
import { exportBackup, importBackup } from "./backup.ts";
import { collections } from "./collections.ts";
import { IN_MEMORY, openDatabase } from "./db/client.ts";
import { DomainError } from "./errors.ts";
import { Repository } from "./repository.ts";

const PIXEL_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function assertCode(work: () => unknown, code: DomainError["code"]) {
    assert.throws(work, (cause) => cause instanceof DomainError && cause.code === code);
}

describe("Repository", () => {
    let repository: Repository;

    beforeEach(() => {
        repository = new Repository(openDatabase(IN_MEMORY));
        repository.seedIfEmpty();
        repository.insert(collections.exhibitors, { id: "A1", name: "Muster GmbH", groupId: "A", categoryId: "unternehmen" });
        repository.insert(collections.talks, { id: "t1", exhibitorId: "A1", startTime: "09:00" });
        repository.upsert(collections.booths, { exhibitorId: "A1", floorId: "eg", x: 10, y: 20, width: 80, height: 60 });
    });

    it("seeds the default content once, in order", () => {
        assert.equal(repository.seedIfEmpty(), false);
        assert.deepEqual(repository.readData().groups.map((group) => group.id), ["A", "B", "C", "D", "E", "F", "G", "H"]);
    });

    it("bumps the revision and notifies listeners on every write", () => {
        const seen: number[] = [];
        repository.subscribe((revision) => seen.push(revision));
        const before = repository.revision;
        const after = repository.updateEvent({ name: "Neue Messe" });
        assert.equal(after, before + 1);
        assert.deepEqual(seen, [after]);
        assert.equal(JSON.parse(repository.snapshotJson()).data.event.name, "Neue Messe");
    });

    it("renames an exhibitor and carries talks and booths along", () => {
        repository.update(collections.exhibitors, "A1", { id: "A9", name: "Muster GmbH", groupId: "A" });
        const data = repository.readData();
        assert.equal(data.talks[0].exhibitorId, "A9");
        assert.equal(data.floorPlan.floors[0].booths[0].exhibitorId, "A9");
    });

    it("deletes talks and booths with their exhibitor", () => {
        repository.remove(collections.exhibitors, "A1");
        const data = repository.readData();
        assert.deepEqual(data.talks, []);
        assert.deepEqual(data.floorPlan.floors[0].booths, []);
    });

    it("refuses to delete a zone that still has exhibitors", () => {
        assertCode(() => repository.remove(collections.groups, "A"), "CONFLICT");
        repository.remove(collections.groups, "B");
        assert.equal(repository.readData().groups.some((group) => group.id === "B"), false);
    });

    it("keeps tracks that still have classes and rejects classes of unknown tracks", () => {
        repository.insert(collections.classes, { id: "5aG", track: "G", year: 5, section: "a", teachers: [] });
        assertCode(() => repository.remove(collections.tracks, "G"), "CONFLICT");
        assertCode(() => repository.insert(collections.classes, { id: "5aX", track: "X", year: 5, teachers: [] }), "CONFLICT");
        repository.remove(collections.tracks, "H");
        assert.deepEqual(repository.readData().tracks.map((track) => track.id), ["G", "R", "OS"]);
    });

    it("reports duplicates, unknown references and missing rows as domain errors", () => {
        assertCode(() => repository.insert(collections.exhibitors, { id: "A1", name: "Doppelt" }), "CONFLICT");
        assertCode(() => repository.insert(collections.talks, { id: "t2", exhibitorId: "gone" }), "CONFLICT");
        assertCode(() => repository.update(collections.rooms, "gone", { id: "gone", name: "Raum" }), "NOT_FOUND");
        assertCode(() => repository.removeFloor("eg"), "CONFLICT");
    });

    it("stores floor shapes with their type-specific properties", () => {
        repository.insert(collections.shapes, { id: "s1", floorId: "eg", type: "arrow", x1: 0, y1: 0, x2: 50, y2: 0, color: "#ff0000" });
        assert.deepEqual(repository.readData().floorPlan.floors[0].shapes, [
            { id: "s1", type: "arrow", x1: 0, y1: 0, x2: 50, y2: 0, color: "#ff0000" },
        ]);
    });

    it("upserts and clears schedule entries", () => {
        repository.insert(collections.classes, { id: "5aG", track: "G", year: 5, section: "a", teachers: ["Müller"] });
        const slot = { classId: "5aG", timeSlotId: "ts1", zoneId: "A" };
        repository.setScheduleEntry({ ...slot, type: "visit" });
        repository.setScheduleEntry({ ...slot, type: "break" });
        assert.deepEqual(repository.readData().classSchedule, [{ id: "5aG:ts1:A", ...slot, type: "break" }]);
        repository.setScheduleEntry({ ...slot, type: null });
        assert.deepEqual(repository.readData().classSchedule, []);
    });
});

describe("backup", () => {
    it("round-trips through a self-contained export and stores images once", async () => {
        const source = new Repository(openDatabase(IN_MEMORY));
        const content = createDefaultData();
        content.event.logoUrl = PIXEL_PNG;
        content.exhibitors = [{ id: "A1", name: "X", groupId: "A", logoUrl: PIXEL_PNG }];
        await importBackup(source, content);

        const data = source.readData();
        assert.match(data.event.logoUrl ?? "", /^\/media\/[0-9a-f]{64}$/);
        assert.equal(data.exhibitors[0].logoUrl, data.event.logoUrl);

        const exported = exportBackup(source);
        assert.match(exported.event.logoUrl ?? "", /^data:image\/webp;base64,/);

        const target = new Repository(openDatabase(IN_MEMORY));
        await importBackup(target, JSON.parse(JSON.stringify(exported)));
        assert.deepEqual(target.readData(), data);
    });

    it("drops inline logos that are not images instead of failing the restore", async () => {
        const repository = new Repository(openDatabase(IN_MEMORY));
        const content = createDefaultData();
        content.event.logoUrl = `data:image/png;base64,${Buffer.from("<script>alert(1)</script>").toString("base64")}`;
        await importBackup(repository, content);
        assert.equal(repository.readData().event.logoUrl, undefined);
    });

    it("rejects files that are not a backup", async () => {
        const repository = new Repository(openDatabase(IN_MEMORY));
        await assert.rejects(importBackup(repository, { event: { name: "Messe" } }),
            (cause) => cause instanceof DomainError && cause.code === "BAD_REQUEST");
    });

    it("prunes images that are no longer referenced", () => {
        const repository = new Repository(openDatabase(IN_MEMORY));
        const url = repository.storeImage(new Uint8Array([1, 2, 3]), "image/png");
        repository.pruneImages();
        assert.equal(repository.image(url.split("/").pop()!), null);
    });
});
