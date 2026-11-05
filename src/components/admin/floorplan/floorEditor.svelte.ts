// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { type D3DragEvent, drag } from "d3-drag";
import { pointer, select } from "d3-selection";
import { zoom, type ZoomTransform, zoomIdentity } from "d3-zoom";
import type { Attachment } from "svelte/attachments";
import type { FairStore } from "../../../lib/client/store.svelte.ts";
import { DEFAULT_BOOTH_SIZE } from "../../../lib/data/defaults.ts";
import type { Point } from "../../../lib/geometry.ts";
import { createId } from "../../../lib/id.ts";
import { boxSnapTargets, type SnapGuide, snapBox, snapLineAngle } from "../../../lib/snapping.ts";
import { type Floor, type Id, isRectShape } from "../../../lib/types.ts";
import {
    DEFAULT_STROKE_COLOR,
    DEFAULT_STROKE_WIDTH,
    type DragState,
    type EditorTool,
    LABEL_DEFAULTS,
    type LinePreview,
    MIN_DRAWN_LINE_LENGTH,
    MIN_DRAWN_RECT_SIZE,
    MIN_SHAPE_SIZE,
    normalizeRect,
    RECT_DEFAULTS,
    type RectPreview,
    type Selection,
} from "./editorState.ts";

const FALLBACK_RECT_SIZE = { width: 100, height: 60 };
const SCALE_EXTENT: [number, number] = [0.5, 6];
const ZOOM_STEP = 1.5;

type DragEvent = D3DragEvent<Element, unknown, unknown>;

/** Interaction state of the floor plan editor; all writes go through the store's actions. */
export class FloorEditor {
    /** The zoomed group; d3 reports pointer positions relative to it, i.e. in floor units. */
    viewport: SVGGElement | undefined = $state();
    transform: ZoomTransform = $state.raw(zoomIdentity);
    tool: EditorTool = $state("select");
    selection: Selection | null = $state(null);
    dragging: DragState | null = $state(null);
    linePreview: LinePreview | null = $state(null);
    rectPreview: RectPreview | null = $state(null);
    snapGuides: SnapGuide[] = $state([]);
    pendingExhibitorId: Id | null = $state(null);
    labelDraft = $state("");
    strokeColor = $state(DEFAULT_STROKE_COLOR);
    strokeWidth = $state(DEFAULT_STROKE_WIDTH);

    readonly #store: FairStore;
    readonly #floor: () => Floor;
    #svg: SVGSVGElement | undefined;

    // Ctrl/Cmd+wheel and pinch zoom while a plain wheel keeps scrolling the page; dragging the background pans only
    // in the select tool. Item drags never get here because d3-drag stops their events from propagating.
    readonly #zoom = zoom<SVGSVGElement, unknown>()
        .scaleExtent(SCALE_EXTENT)
        .filter((event: Event) => {
            if (event instanceof WheelEvent) {
                return event.ctrlKey || event.metaKey;
            }
            if (event.type.startsWith("touch") && (event as TouchEvent).touches.length > 1) {
                return true;
            }
            return !(event as MouseEvent).button && this.tool === "select" && !this.pendingExhibitorId;
        })
        .on("zoom", (event: { transform: ZoomTransform }) => (this.transform = event.transform));

    constructor(store: FairStore, floor: () => Floor) {
        this.#store = store;
        this.#floor = floor;
    }

    get zoomed(): boolean {
        return this.transform.k !== 1 || this.transform.x !== 0 || this.transform.y !== 0;
    }

    get #actions() {
        return this.#store.actions;
    }

    get #drawing(): boolean {
        return !this.pendingExhibitorId && (this.tool === "rect" || this.tool === "line" || this.tool === "arrow");
    }

    /** Attachment for the canvas: zooming, panning and drawing with the shape tools. */
    canvas: Attachment<SVGSVGElement> = (svg) => {
        this.#svg = svg;
        const canvas = select(svg);
        canvas.call(this.#zoom).on("dblclick.zoom", null);
        canvas.call(drag<SVGSVGElement, unknown>()
            .container(() => this.viewport!)
            .filter((event: MouseEvent) => !event.button && this.#drawing)
            .on("start", (event: DragEvent) => this.#startDrawing(event))
            .on("drag", (event: DragEvent) => this.#draw(event))
            .on("end", () => this.#finish()));
        return () => {
            canvas.on(".zoom", null).on(".drag", null);
            this.#svg = undefined;
        };
    };

    /** Attachment making a plan item or handle draggable; `begin` describes the drag from its start point. */
    draggable(begin: (start: Point) => DragState): Attachment<SVGElement> {
        return (node) => {
            const item = select(node);
            item.call(drag<SVGElement, unknown>()
                .container(() => this.viewport!)
                .on("start", (event: DragEvent) => this.#startItem(begin({ x: event.x, y: event.y })))
                .on("drag", (event: DragEvent) => this.#moveItem({ x: event.x, y: event.y }))
                .on("end", () => this.#finish()));
            return () => void item.on(".drag", null);
        };
    }

    zoomIn = () => this.#zoomBy(ZOOM_STEP);

    zoomOut = () => this.#zoomBy(1 / ZOOM_STEP);

    /** Shows the whole floor again and limits panning to its current size. */
    resetView = () => {
        const { width, height } = this.#floor();
        this.#zoom.translateExtent([[0, 0], [width, height]]);
        if (this.#svg) {
            select(this.#svg).call(this.#zoom.transform, zoomIdentity);
        }
    };

    resetInteraction = () => {
        this.selection = null;
        this.dragging = null;
        this.linePreview = null;
        this.rectPreview = null;
        this.pendingExhibitorId = null;
        this.snapGuides = [];
    };

    // d3 suppresses the click that follows a drag or pan, so every click arriving here is a real one
    onCanvasClick = (event: MouseEvent) => {
        if (!this.viewport) {
            return;
        }
        const floor = this.#floor();
        const [x, y] = pointer(event, this.viewport);

        if (this.pendingExhibitorId) {
            this.#actions.booths.place(floor.id, this.pendingExhibitorId, {
                x: x - DEFAULT_BOOTH_SIZE.width / 2,
                y: y - DEFAULT_BOOTH_SIZE.height / 2,
                ...DEFAULT_BOOTH_SIZE,
            });
            this.pendingExhibitorId = null;
            return;
        }

        if (this.tool === "label" && this.labelDraft.trim()) {
            const id = createId();
            this.#actions.labels.add(floor.id, { id, text: this.labelDraft, x, y, ...LABEL_DEFAULTS });
            this.selection = { kind: "label", id };
            this.labelDraft = "";
            this.tool = "select";
            return;
        }

        this.selection = null;
    };

    #zoomBy(factor: number): void {
        if (this.#svg) {
            select(this.#svg).call(this.#zoom.scaleBy, factor);
        }
    }

    #startItem(drag: DragState): void {
        if (drag.kind !== "booth-resize" && drag.kind !== "rect-resize") {
            this.selection = {
                kind: drag.kind === "booth" ? "booth" : drag.kind === "label" ? "label" : "shape",
                id: drag.id,
            };
        }
        this.dragging = drag;
    }

    #moveItem(point: Point): void {
        const dragging = this.dragging;
        if (!dragging) {
            return;
        }
        const floor = this.#floor();
        const delta = { x: point.x - dragging.start.x, y: point.y - dragging.start.y };

        switch (dragging.kind) {
            case "booth":
                this.#dragBooth(floor, dragging, delta);
                break;
            case "label":
                this.snapGuides = [];
                this.#actions.labels.update(floor.id, dragging.id, {
                    x: dragging.origin.x + delta.x,
                    y: dragging.origin.y + delta.y,
                });
                break;
            case "linear-shape":
                this.snapGuides = [];
                this.#actions.shapes.update(floor.id, dragging.id, {
                    x1: dragging.origin.x1 + delta.x,
                    y1: dragging.origin.y1 + delta.y,
                    x2: dragging.origin.x2 + delta.x,
                    y2: dragging.origin.y2 + delta.y,
                });
                break;
            case "rect-shape":
                this.#dragRectShape(floor, dragging, delta);
                break;
            case "booth-resize":
                this.snapGuides = [];
                this.#actions.booths.place(floor.id, dragging.id, {
                    width: Math.max(MIN_SHAPE_SIZE, dragging.size.width + delta.x),
                    height: Math.max(MIN_SHAPE_SIZE, dragging.size.height + delta.y),
                });
                break;
            case "rect-resize":
                this.snapGuides = [];
                this.#actions.shapes.update(floor.id, dragging.id, {
                    width: Math.max(MIN_SHAPE_SIZE, dragging.size.width + delta.x),
                    height: Math.max(MIN_SHAPE_SIZE, dragging.size.height + delta.y),
                });
                break;
        }
    }

    #startDrawing({ x, y }: DragEvent): void {
        if (this.tool === "arrow" || this.tool === "line") {
            this.linePreview = { x1: x, y1: y, x2: x, y2: y, tool: this.tool };
        } else {
            this.rectPreview = { x, y, width: 0, height: 0 };
        }
    }

    #draw({ x, y, sourceEvent }: DragEvent): void {
        if (this.linePreview) {
            const shiftKey = (sourceEvent as MouseEvent).shiftKey === true;
            this.linePreview = { ...this.linePreview, ...snapLineAngle({ ...this.linePreview, x2: x, y2: y }, shiftKey) };
        } else if (this.rectPreview) {
            this.rectPreview = { ...this.rectPreview, width: x - this.rectPreview.x, height: y - this.rectPreview.y };
        }
    }

    #finish(): void {
        if (this.linePreview) {
            this.#commitLinePreview(this.linePreview);
        }
        if (this.rectPreview) {
            this.#commitRectPreview(this.rectPreview);
        }
        this.linePreview = null;
        this.rectPreview = null;
        this.snapGuides = [];
        this.dragging = null;
    }

    #dragBooth(floor: Floor, drag: Extract<DragState, { kind: "booth" }>, delta: Point): void {
        const booth = floor.booths.find((item) => item.exhibitorId === drag.id);
        const snapped = snapBox(
            {
                x: Math.max(0, Math.min(drag.origin.x + delta.x, floor.width - MIN_SHAPE_SIZE)),
                y: Math.max(0, Math.min(drag.origin.y + delta.y, floor.height - MIN_SHAPE_SIZE)),
                width: booth?.width ?? DEFAULT_BOOTH_SIZE.width,
                height: booth?.height ?? DEFAULT_BOOTH_SIZE.height,
            },
            boxSnapTargets(floor, { kind: "booth", id: drag.id }),
            floor,
        );
        this.snapGuides = snapped.guides;
        this.#actions.booths.place(floor.id, drag.id, { x: snapped.x, y: snapped.y });
    }

    #dragRectShape(floor: Floor, drag: Extract<DragState, { kind: "rect-shape" }>, delta: Point): void {
        const shape = floor.shapes.find((item) => item.id === drag.id);
        const size = shape && isRectShape(shape) ? { width: shape.width, height: shape.height } : FALLBACK_RECT_SIZE;
        const snapped = snapBox(
            { x: drag.origin.x + delta.x, y: drag.origin.y + delta.y, ...size },
            boxSnapTargets(floor, { kind: "shape", id: drag.id }),
            floor,
        );
        this.snapGuides = snapped.guides;
        this.#actions.shapes.update(floor.id, drag.id, { x: snapped.x, y: snapped.y });
    }

    #commitLinePreview(preview: LinePreview): void {
        const length = Math.hypot(preview.x2 - preview.x1, preview.y2 - preview.y1);
        if (length <= MIN_DRAWN_LINE_LENGTH) {
            return;
        }

        const id = createId();
        this.#actions.shapes.add(this.#floor().id, {
            id,
            type: preview.tool,
            x1: preview.x1,
            y1: preview.y1,
            x2: preview.x2,
            y2: preview.y2,
            color: this.strokeColor,
            strokeWidth: this.strokeWidth,
        });
        this.selection = { kind: "shape", id };
        this.tool = "select";
    }

    #commitRectPreview(preview: RectPreview): void {
        const rect = normalizeRect(preview);
        if (rect.width <= MIN_DRAWN_RECT_SIZE || rect.height <= MIN_DRAWN_RECT_SIZE) {
            return;
        }

        const id = createId();
        this.#actions.shapes.add(this.#floor().id, { id, type: "rect", ...rect, ...RECT_DEFAULTS });
        this.selection = { kind: "shape", id };
        this.tool = "select";
    }
}
