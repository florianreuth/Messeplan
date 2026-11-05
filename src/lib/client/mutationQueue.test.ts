// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Mutation, MutationQueue } from "./mutationQueue.ts";

function recordingQueue() {
    const sent: string[] = [];
    const errors: unknown[] = [];
    let revision = 0;
    const queue = new MutationQueue({
        debounceMs: 1_000_000,
        onStart: () => undefined,
        onWritten: () => undefined,
        onError: (cause) => errors.push(cause),
        onIdle: () => undefined,
    });
    const write = (key: string, label: string, fail = false): Mutation => ({
        key,
        run: async () => {
            if (fail) {
                throw new Error(label);
            }
            sent.push(label);
            return { revision: ++revision };
        },
    });
    return { queue, sent, errors, write };
}

describe("MutationQueue", () => {
    it("coalesces writes of the same key and keeps the order of distinct keys", async () => {
        const { queue, sent, write } = recordingQueue();
        queue.enqueue(write("a", "a1"));
        queue.enqueue(write("b", "b1"));
        queue.enqueue(write("a", "a2"));
        assert.equal(queue.busy, true);
        await queue.flush();
        assert.deepEqual(sent, ["a2", "b1"]);
        assert.equal(queue.busy, false);
    });

    it("discards the remaining writes after a failure", async () => {
        const { queue, sent, errors, write } = recordingQueue();
        queue.enqueue(write("a", "a1", true));
        queue.enqueue(write("b", "b1"));
        await queue.flush();
        assert.deepEqual(sent, []);
        assert.equal(errors.length, 1);
        assert.equal(queue.busy, false);
    });

    it("lets concurrent flushes wait for the running one", async () => {
        const { queue, sent, write } = recordingQueue();
        queue.enqueue(write("a", "a1"));
        const first = queue.flush();
        queue.enqueue(write("b", "b1"));
        await Promise.all([first, queue.flush()]);
        assert.deepEqual(sent, ["a1", "b1"]);
    });
});
