// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { select } from "d3-selection";
import { type D3ZoomEvent, zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { ElementSize } from "runed";
import { untrack } from "svelte";
import type { Attachment } from "svelte/attachments";

const MAX_ZOOM = 6;
const MAX_INITIAL_ZOOM = 3;
const CLICK_DISTANCE_PX = 6;
const ZOOMED_EPSILON = 0.01;
const BUTTON_TRANSITION = "transform 0.2s ease-out";

export interface PanZoomOptions {
    width: number;
    height: number;
    /** Changing it resets the view, e.g. when switching floors. */
    resetKey?: string;
}

/** d3-zoom for fixed-size content: fitted to the wrapper, initially covering it, clamped to its bounds. */
export class PanZoom {
    readonly #options: () => PanZoomOptions;
    readonly #behavior = zoom<HTMLElement, unknown>()
        .scaleExtent([1, MAX_ZOOM])
        .clickDistance(CLICK_DISTANCE_PX)
        // The wheel only zooms with Ctrl/Cmd, otherwise the page scrolls as usual
        .filter((event: MouseEvent) => event.type === "wheel" ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.button);
    #element: HTMLElement | null = $state(null);
    readonly #size = new ElementSize(() => this.#element, { box: "content-box" });
    #box = $derived({ width: this.#size.width, height: this.#size.height });
    #transform = $state<ZoomTransform>(zoomIdentity);
    #animated = $state(false);
    #touched = false;

    #fit = $derived.by(() => {
        const { width, height } = this.#options();
        return this.#box.width && this.#box.height ? Math.min(this.#box.width / width, this.#box.height / height) : 0;
    });
    #contentWidth = $derived.by(() => this.#options().width * this.#fit);
    #contentHeight = $derived.by(() => this.#options().height * this.#fit);
    // On narrow screens the plan covers the fixed-height wrapper instead of leaving empty bands
    #initialScale = $derived(this.#contentWidth && this.#contentHeight
        ? Math.min(MAX_INITIAL_ZOOM, Math.max(1, this.#box.width / this.#contentWidth, this.#box.height / this.#contentHeight))
        : 1);

    /** Must be created during component initialisation, since it registers effects. */
    constructor(options: () => PanZoomOptions) {
        this.#options = options;
        this.#behavior.on("zoom", (event: D3ZoomEvent<HTMLElement, unknown>) => {
            if (event.sourceEvent) {
                this.#touched = true;
                this.#animated = false;
            }
            this.#transform = event.transform;
        });

        $effect(() => {
            const { width, height } = this.#box;
            this.#behavior.extent([[0, 0], [width, height]]).translateExtent([[0, 0], [this.#contentWidth, this.#contentHeight]]);
            const initial = this.#initialTransform();
            untrack(() => {
                if (!this.#touched) {
                    this.#apply(initial);
                }
            });
        });

        // Through a derived, so live data refreshes of the same floor keep the current view
        const resetKey = $derived(this.#options().resetKey);
        $effect(() => {
            void resetKey;
            untrack(() => this.reset());
        });
    }

    get zoomed(): boolean {
        return Math.abs(this.#transform.k - this.#initialScale) > ZOOMED_EPSILON;
    }

    // Beyond the initial view the plan owns all touch gestures; before that, vertical swipes scroll the page
    // (the covering initial view leaves no vertical room to pan, so nothing is lost)
    get touchAction(): string {
        return this.#transform.k > this.#initialScale + ZOOMED_EPSILON ? "none" : "pan-y";
    }

    get contentStyle(): string {
        const { k, x, y } = this.#transform;
        return `width: ${this.#contentWidth}px; height: ${this.#contentHeight}px; transform-origin: 0 0; `
            + `transform: translate(${x}px, ${y}px) scale(${k})${this.#animated ? `; transition: ${BUTTON_TRANSITION}` : ""}`;
    }

    /** Back to the initial view; `animated` for the reset button. */
    reset = (animated = false) => {
        this.#touched = false;
        this.#animated = animated;
        this.#apply(this.#initialTransform());
    };

    /** Zooms around the center by `factor`, e.g. for the zoom buttons. */
    zoomBy = (factor: number) => {
        if (!this.#element) {
            return;
        }
        this.#touched = true;
        this.#animated = true;
        this.#behavior.scaleBy(select(this.#element), factor);
    };

    attach: Attachment<HTMLElement> = (element) => {
        this.#element = element;
        // Double-click/-tap zoom would also fire on booths, which open their details on click
        const selection = select(element).call(this.#behavior).on("dblclick.zoom", null);
        return () => {
            selection.on(".zoom", null);
            this.#element = null;
        };
    };

    // Left-aligned when wider than the wrapper (like before), centered otherwise; the translate extent clamps the rest
    #initialTransform(): ZoomTransform {
        const scale = this.#initialScale;
        const spareWidth = this.#box.width - this.#contentWidth * scale;
        const spareHeight = this.#box.height - this.#contentHeight * scale;
        return zoomIdentity.translate(Math.max(0, spareWidth / 2), spareHeight / 2).scale(scale);
    }

    #apply(transform: ZoomTransform): void {
        if (this.#element) {
            this.#behavior.transform(select(this.#element), transform);
        } else {
            this.#transform = transform;
        }
    }
}
