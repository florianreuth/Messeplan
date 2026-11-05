// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classDisplayName, classIdFor, trackYears } from "./classes.ts";
import type { Track } from "./types.ts";

const lower: Track = { id: "G", label: "Gymnasialzweig", firstYear: 5, lastYear: 10, sections: true };
const upper: Track = { id: "OS", label: "Oberstufe", firstYear: 11, lastYear: 13, sections: false };

describe("classes", () => {
    it("derives class ids with letters only for tracks that use them", () => {
        assert.equal(classIdFor(lower, 7, "b"), "7bG");
        assert.equal(classIdFor(upper, 12, "b"), "12OS");
    });

    it("lists the years of a track", () => {
        assert.deepEqual(trackYears(upper), [11, 12, 13]);
    });

    it("spells out the track for classes without letters", () => {
        assert.equal(classDisplayName({ id: "12OS", track: "OS", year: 12 }, upper), "Oberstufe 12");
        assert.equal(classDisplayName({ id: "7bG", track: "G", year: 7, section: "b" }, lower), "7bG");
        assert.equal(classDisplayName({ id: "7bX", track: "X", year: 7, section: "b" }, undefined), "7bX");
    });
});
