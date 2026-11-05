// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

const DRAG_THRESHOLD_PX = 6;
const CLOSE_DISTANCE_PX = 120;
const CLOSE_VELOCITY_PX_PER_MS = 0.5;
const MOBILE_QUERY = "(max-width: 639px)";
const SNAP_BACK = "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)";

/** Swipe-down-to-close for the bottom sheet on mobile; bind the handlers to the sheet's header. */
export class SheetDrag {
    /** Whether the sheet was dragged at least once; the entry animation must not replay afterwards. */
    dragged = $state(false);
    #offset = $state(0);
    #dragging = $state(false);
    #startY: number | null = null;
    #sample: { y: number; time: number } | null = null;
    #velocity = 0;
    #moved = false;
    readonly #onClose: () => void;

    constructor(onClose: () => void) {
        this.#onClose = onClose;
    }

    get panelStyle(): string | undefined {
        if (!this.dragged) {
            return undefined;
        }
        return `transform: translateY(${this.#offset}px); transition: ${this.#dragging ? "none" : SNAP_BACK}`;
    }

    onpointerdown = (event: PointerEvent) => {
        if (!window.matchMedia(MOBILE_QUERY).matches) {
            return;
        }
        this.#startY = event.clientY;
        this.#sample = { y: event.clientY, time: event.timeStamp };
        this.#velocity = 0;
        this.#moved = false;
    };

    onpointermove = (event: PointerEvent) => {
        if (this.#startY === null) {
            return;
        }

        const previous = this.#sample;
        if (previous) {
            const elapsed = event.timeStamp - previous.time;
            if (elapsed > 0) {
                this.#velocity = (event.clientY - previous.y) / elapsed;
            }
        }
        this.#sample = { y: event.clientY, time: event.timeStamp };

        const distance = event.clientY - this.#startY;
        if (!this.#moved) {
            if (Math.abs(distance) < DRAG_THRESHOLD_PX) {
                return;
            }
            this.#moved = true;
            this.#dragging = true;
            this.dragged = true;
            // Capture only now, so a tap on the close button still reaches it
            (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        }
        this.#offset = Math.max(0, distance);
    };

    onpointerup = (event: PointerEvent) => this.#end(event);

    onpointercancel = (event: PointerEvent) => this.#end(event);

    onclickcapture = (event: MouseEvent) => {
        if (this.#moved) {
            event.stopPropagation();
            this.#moved = false;
        }
    };

    #end(event: PointerEvent): void {
        const start = this.#startY;
        this.#startY = null;
        this.#sample = null;
        this.#dragging = false;
        this.#offset = 0;
        if (start === null || !this.#moved) {
            return;
        }

        const target = event.currentTarget as HTMLElement;
        if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
        }

        // Touch gestures are often not followed by a click; release the flag, or the next keyboard click is swallowed
        setTimeout(() => (this.#moved = false), 0);

        const distance = event.clientY - start;
        const flicked = distance > DRAG_THRESHOLD_PX && this.#velocity > CLOSE_VELOCITY_PX_PER_MS;
        if (distance > CLOSE_DISTANCE_PX || flicked) {
            this.#onClose();
        }
    }
}
