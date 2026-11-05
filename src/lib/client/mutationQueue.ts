// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

export interface Mutation {
    /** Mutations with the same key replace each other while pending, e.g. the many writes of one drag. */
    key: string;
    run(): Promise<{ revision: number }>;
}

export interface MutationQueueOptions {
    onStart(): void;
    onWritten(revision: number): void;
    /** Called once per failed flush; the remaining pending mutations are discarded. */
    onError(cause: unknown): void;
    onIdle(): void;
    debounceMs: number;
}

// Drags, color pickers and number inputs write continuously; this sends only the latest write per item, in order
export class MutationQueue {
    readonly #options: MutationQueueOptions;
    readonly #pending = new Map<string, Mutation>();
    #timer: ReturnType<typeof setTimeout> | undefined;
    #flushing: Promise<void> | null = null;

    constructor(options: MutationQueueOptions) {
        this.#options = options;
    }

    /** Whether writes are pending or in flight. */
    get busy(): boolean {
        return this.#flushing !== null || this.#pending.size > 0;
    }

    enqueue(mutation: Mutation): void {
        // Map#set keeps the original position of an existing key, so the order of distinct writes is preserved
        this.#pending.set(mutation.key, mutation);
        clearTimeout(this.#timer);
        this.#timer = setTimeout(() => void this.flush(), this.#options.debounceMs);
    }

    /** Sends all pending writes; resolves once nothing is pending or in flight. */
    async flush(): Promise<void> {
        clearTimeout(this.#timer);
        while (this.#flushing) {
            await this.#flushing;
        }
        if (this.#pending.size === 0) {
            return;
        }
        this.#flushing = this.#drain();
        await this.#flushing;
        this.#flushing = null;
        if (this.#pending.size > 0) {
            await this.flush();
        } else {
            this.#options.onIdle();
        }
    }

    async #drain(): Promise<void> {
        this.#options.onStart();
        try {
            for (const [key, mutation] of this.#pending) {
                this.#pending.delete(key);
                this.#options.onWritten((await mutation.run()).revision);
            }
        } catch (cause) {
            this.#pending.clear();
            this.#options.onError(cause);
        }
    }
}
