// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppData } from "../types.ts";
import { createDefaultData } from "./defaults.ts";
import { dataReducer } from "./reducer.ts";

function fixture(): AppData {
    const data = createDefaultData();
    data.exhibitors = [{ id: "A1", name: "Muster GmbH", groupId: "A", categoryId: "unternehmen" }];
    data.rooms = [{ id: "r1", name: "Raum 1" }];
    data.talks = [{ id: "t1", exhibitorId: "A1", roomId: "r1", startTime: "09:00" }];
    data.classes = [{ id: "5aG", track: "G", year: 5, section: "a" }];
    data.classSchedule = [{ id: "5aG:ts1:A", classId: "5aG", timeSlotId: "ts1", zoneId: "A", type: "visit" }];
    data.floorPlan.floors[0].booths = [{ exhibitorId: "A1", x: 0, y: 0, width: 80, height: 60 }];
    return data;
}

describe("dataReducer", () => {
    it("removes talks and booths together with their exhibitor", () => {
        const next = dataReducer(fixture(), { type: "collection/remove", collection: "exhibitors", id: "A1" });
        assert.deepEqual(next.talks, []);
        assert.deepEqual(next.floorPlan.floors[0].booths, []);
    });

    it("clears references to removed categories and rooms", () => {
        let next = dataReducer(fixture(), { type: "collection/remove", collection: "categories", id: "unternehmen" });
        next = dataReducer(next, { type: "collection/remove", collection: "rooms", id: "r1" });
        assert.equal(next.exhibitors[0].categoryId, undefined);
        assert.equal(next.talks[0].roomId, undefined);
    });

    it("removes schedule entries of removed classes, time slots and zones", () => {
        for (const [collection, id] of [["classes", "5aG"], ["timeSlots", "ts1"], ["groups", "A"]] as const) {
            const next = dataReducer(fixture(), { type: "collection/remove", collection, id });
            assert.deepEqual(next.classSchedule, [], collection);
        }
    });

    it("renames an exhibitor everywhere it is referenced", () => {
        const next = dataReducer(fixture(), { type: "exhibitor/rename", id: "A1", nextId: "A7" });
        assert.equal(next.exhibitors[0].id, "A7");
        assert.equal(next.talks[0].exhibitorId, "A7");
        assert.equal(next.floorPlan.floors[0].booths[0].exhibitorId, "A7");
    });

    it("keeps time slots sorted by start time", () => {
        const next = dataReducer(fixture(), { type: "collection/add", collection: "timeSlots", item: { id: "early", start: "06:00", end: "07:00" } });
        assert.equal(next.timeSlots[0].id, "early");
    });

    it("sets, changes and clears one schedule entry per slot", () => {
        const slot = { classId: "5aG", timeSlotId: "ts2", zoneId: "B" };
        let next = dataReducer(fixture(), { type: "schedule/set", ...slot, value: "visit" });
        next = dataReducer(next, { type: "schedule/set", ...slot, value: "break" });
        assert.deepEqual(next.classSchedule.filter((entry) => entry.timeSlotId === "ts2").map((entry) => entry.type), ["break"]);
        next = dataReducer(next, { type: "schedule/set", ...slot, value: null });
        assert.equal(next.classSchedule.length, 1);
    });

    it("moves a booth to another floor instead of duplicating it", () => {
        let next = dataReducer(fixture(), { type: "floor/add", id: "og", label: "OG" });
        next = dataReducer(next, { type: "booth/place", floorId: "og", exhibitorId: "A1", patch: { x: 5 } });
        assert.deepEqual(next.floorPlan.floors.map((floor) => floor.booths.length), [0, 1]);
        assert.equal(next.floorPlan.floors[1].booths[0].x, 5);
    });

    it("never removes the last floor", () => {
        const state = fixture();
        assert.equal(dataReducer(state, { type: "floor/remove", id: "eg" }), state);
    });
});
