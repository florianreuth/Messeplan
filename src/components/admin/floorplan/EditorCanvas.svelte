<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Minus from "@lucide/svelte/icons/minus";
    import Plus from "@lucide/svelte/icons/plus";
    import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
    import { untrack } from "svelte";
    import { DEFAULT_GROUP_COLOR } from "../../../lib/colors.ts";
    import { type Booth, type Exhibitor, type Floor, type FloorLabel, type Group, isLinearShape, isRectShape, type RectShape } from "../../../lib/types.ts";
    import LinearShape, { SELECTION_COLOR } from "../../floorplan/LinearShape.svelte";
    import { type DragState, LABEL_DEFAULTS, normalizeRect, RECT_DEFAULTS } from "./editorState.ts";
    import type { FloorEditor } from "./floorEditor.svelte.ts";

    interface Props {
        editor: FloorEditor;
        floor: Floor;
        exhibitors: Exhibitor[];
        groups: Group[];
    }

    const GRID_SIZE = 50;
    const PLAN_FONT = "DM Sans Variable, DM Sans, sans-serif";
    const DRAG_SHADOW = "drop-shadow(0 4px 8px rgba(0,0,0,0.25))";
    const HANDLE_SIZE = 12;
    const LOGO_MIN_SIZE = 40;
    const ZOOM_BUTTON = "flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/70 bg-white/80 text-slate-500 "
        + "backdrop-blur-sm transition-all hover:text-slate-800 active:scale-95";

    let { editor, floor, exhibitors, groups }: Props = $props();

    const rectShapes = $derived(floor.shapes.filter(isRectShape));
    const linearShapes = $derived(floor.shapes.filter(isLinearShape));
    const isEmpty = $derived(floor.booths.length === 0 && floor.shapes.length === 0 && floor.labels.length === 0);
    const previewRect = $derived(editor.rectPreview ? normalizeRect(editor.rectPreview) : null);
    const columns = $derived(Math.floor(floor.width / GRID_SIZE) + 1);
    const rows = $derived(Math.floor(floor.height / GRID_SIZE) + 1);

    const cursor = $derived.by(() => {
        if (editor.linePreview || editor.rectPreview || editor.pendingExhibitorId) {
            return "crosshair";
        }
        if (editor.tool === "arrow" || editor.tool === "line" || editor.tool === "rect") {
            return "crosshair";
        }
        if (editor.tool === "label") {
            return "text";
        }
        if (editor.dragging?.kind === "booth-resize" || editor.dragging?.kind === "rect-resize") {
            return "se-resize";
        }
        if (editor.dragging) {
            return "grabbing";
        }
        return "default";
    });

    // A new floor or a changed floor size invalidates the zoom and its pan limits. Every edit produces a new floor
    // object, so the effect depends on a derived key instead; otherwise the view would reset mid-drag.
    const viewKey = $derived(`${floor.id}:${floor.width}x${floor.height}`);
    $effect(() => {
        void viewKey;
        untrack(() => editor.resetView());
    });

    const groupColor = (exhibitor: Exhibitor) =>
        groups.find((group) => group.id === exhibitor.groupId)?.color ?? DEFAULT_GROUP_COLOR;

    const isSelected = (kind: string, id: string) => editor.selection?.kind === kind && editor.selection.id === id;
    const isDragging = (kind: DragState["kind"], id: string) => editor.dragging?.kind === kind && editor.dragging.id === id;
    // Keeps a click on an item from reaching the canvas, which would deselect it again
    const stop = (event: MouseEvent) => event.stopPropagation();

    function labelHitBox(label: FloorLabel) {
        const fontSize = label.fontSize || LABEL_DEFAULTS.fontSize;
        return {
            x: label.x - 4,
            y: label.y - fontSize - 2,
            width: (label.text?.length || 1) * (fontSize * 0.6) + 8,
            height: fontSize + 8,
        };
    }
</script>

{#snippet resizeHandle(x: number, y: number, begin: (start: { x: number; y: number }) => DragState)}
    <rect
        {@attach editor.draggable(begin)}
        x={x - 6} y={y - 6} width={HANDLE_SIZE} height={HANDLE_SIZE} rx="2"
        fill={SELECTION_COLOR} stroke="white" stroke-width="1.5"
        style="cursor: se-resize"
    />
{/snippet}

{#snippet rectNode(shape: RectShape)}
    {@const selected = isSelected("shape", shape.id)}
    {@const dragging = isDragging("rect-shape", shape.id)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <g
        {@attach editor.draggable((start) => ({ kind: "rect-shape", id: shape.id, start, origin: { x: shape.x, y: shape.y } }))}
        onclick={stop}
        style="cursor: {dragging ? 'grabbing' : 'grab'}; user-select: none"
    >
        <rect
            x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx="4"
            fill={shape.fill || RECT_DEFAULTS.fill}
            stroke={selected ? SELECTION_COLOR : (shape.stroke || RECT_DEFAULTS.stroke)}
            stroke-width={selected ? 2.5 : (shape.strokeWidth || RECT_DEFAULTS.strokeWidth)}
            filter={dragging ? DRAG_SHADOW : undefined}
        />
        {#if shape.label}
            <text
                x={shape.x + shape.width / 2} y={shape.y + shape.height / 2}
                text-anchor="middle" dominant-baseline="middle"
                font-size={shape.fontSize || RECT_DEFAULTS.fontSize}
                fill={shape.textColor || RECT_DEFAULTS.textColor}
                font-family={PLAN_FONT} font-weight="600" style="pointer-events: none"
            >{shape.label}</text>
        {/if}
        {#if selected}
            {@render resizeHandle(shape.x + shape.width, shape.y + shape.height, (start) => ({
                kind: "rect-resize",
                id: shape.id,
                start,
                size: { width: shape.width, height: shape.height },
            }))}
        {/if}
    </g>
{/snippet}

{#snippet boothNode(booth: Booth, exhibitor: Exhibitor)}
    {@const color = groupColor(exhibitor)}
    {@const selected = isSelected("booth", exhibitor.id)}
    {@const dragging = isDragging("booth", exhibitor.id)}
    {@const showLogo = !!exhibitor.logoUrl && booth.width > LOGO_MIN_SIZE && booth.height > LOGO_MIN_SIZE}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <g
        {@attach editor.draggable((start) => ({ kind: "booth", id: exhibitor.id, start, origin: { x: booth.x, y: booth.y } }))}
        onclick={stop}
        style="cursor: {dragging ? 'grabbing' : 'grab'}; user-select: none"
    >
        <rect
            x={booth.x} y={booth.y} width={booth.width} height={booth.height} rx="4"
            fill={color + (dragging ? "ff" : "cc")}
            stroke={selected ? SELECTION_COLOR : (dragging ? "#fff" : color)}
            stroke-width={selected || dragging ? 2.5 : 1.5}
            filter={dragging ? DRAG_SHADOW : undefined}
        />
        {#if showLogo}
            <image
                href={exhibitor.logoUrl}
                x={booth.x + 4} y={booth.y + 4}
                width={Math.min(booth.width - 8, 32)}
                height={Math.min(booth.height - 22, 32)}
                preserveAspectRatio="xMidYMid meet"
                style="pointer-events: none"
            />
        {/if}
        <text
            x={booth.x + booth.width / 2} y={booth.y + booth.height - 6}
            text-anchor="middle"
            font-size={Math.max(10, Math.min(13, booth.width / 5))}
            font-weight="700" fill="white" font-family={PLAN_FONT}
            style="pointer-events: none"
        >{exhibitor.id}</text>
        {#if selected}
            {@render resizeHandle(booth.x + booth.width, booth.y + booth.height, (start) => ({
                kind: "booth-resize",
                id: exhibitor.id,
                start,
                size: { width: booth.width, height: booth.height },
            }))}
        {/if}
    </g>
{/snippet}

{#snippet labelNode(label: FloorLabel)}
    {@const hitBox = labelHitBox(label)}
    {@const dragging = isDragging("label", label.id)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <g
        {@attach editor.draggable((start) => ({ kind: "label", id: label.id, start, origin: { x: label.x, y: label.y } }))}
        onclick={stop}
        style="cursor: {dragging ? 'grabbing' : 'grab'}; user-select: none"
    >
        {#if isSelected("label", label.id)}
            <rect {...hitBox} rx="3" fill="none" stroke={SELECTION_COLOR} stroke-width="1.5" stroke-dasharray="4 2"/>
        {/if}
        <rect {...hitBox} fill="transparent" stroke="none"/>
        <text
            x={label.x} y={label.y}
            font-size={label.fontSize || LABEL_DEFAULTS.fontSize} fill={label.color || LABEL_DEFAULTS.color}
            font-family={PLAN_FONT} font-weight="600" style="pointer-events: none"
        >{label.text}</text>
    </g>
{/snippet}

<div class="relative">
    <!-- The canvas is a pointer-only editing surface; every property is also editable in the side panels -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <svg
        {@attach editor.canvas}
        viewBox="0 0 {floor.width} {floor.height}"
        style="display: block; min-width: 500px; width: 100%; max-height: 65vh; cursor: {cursor}"
        onclick={editor.onCanvasClick}
    >
        <g bind:this={editor.viewport} transform={editor.transform.toString()}>
            <rect width={floor.width} height={floor.height} fill="#f1f5f9"/>
            {#each { length: columns }, index (index)}
                <line x1={index * GRID_SIZE} y1="0" x2={index * GRID_SIZE} y2={floor.height} stroke="#e2e8f0" stroke-width="0.5"/>
            {/each}
            {#each { length: rows }, index (index)}
                <line x1="0" y1={index * GRID_SIZE} x2={floor.width} y2={index * GRID_SIZE} stroke="#e2e8f0" stroke-width="0.5"/>
            {/each}

            {#if isEmpty}
                <text x={floor.width / 2} y={floor.height / 2} text-anchor="middle" fill="#cbd5e1" font-size="14" font-family={PLAN_FONT}>
                    Aussteller aus der Liste wählen und auf die Karte klicken
                </text>
            {/if}

            {#each rectShapes as shape (shape.id)}
                {@render rectNode(shape)}
            {/each}

            {#if previewRect && (previewRect.width > 2 || previewRect.height > 2)}
                <rect
                    {...previewRect} rx="4"
                    fill={RECT_DEFAULTS.fill} stroke={RECT_DEFAULTS.stroke} stroke-width={RECT_DEFAULTS.strokeWidth}
                    opacity="0.7" style="pointer-events: none"
                />
            {/if}

            {#each linearShapes as shape (shape.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                <g
                    {@attach editor.draggable((start) => ({
                        kind: "linear-shape",
                        id: shape.id,
                        start,
                        origin: { x1: shape.x1, y1: shape.y1, x2: shape.x2, y2: shape.y2 },
                    }))}
                    onclick={stop}
                    style="cursor: {editor.dragging?.id === shape.id ? 'grabbing' : 'grab'}"
                >
                    <LinearShape {shape} interactive selected={editor.selection?.id === shape.id}/>
                </g>
            {/each}

            {#if editor.linePreview}
                <LinearShape
                    shape={{
                        id: "preview",
                        type: editor.linePreview.tool,
                        x1: editor.linePreview.x1,
                        y1: editor.linePreview.y1,
                        x2: editor.linePreview.x2,
                        y2: editor.linePreview.y2,
                        strokeWidth: editor.strokeWidth,
                    }}
                    color={editor.strokeColor}
                />
            {/if}

            {#each floor.booths as booth (booth.exhibitorId)}
                {@const exhibitor = exhibitors.find((item) => item.id === booth.exhibitorId)}
                {#if exhibitor}
                    {@render boothNode(booth, exhibitor)}
                {/if}
            {/each}

            {#each editor.snapGuides as guide, index (index)}
                <line
                    {...guide}
                    stroke={SELECTION_COLOR} stroke-width="1" stroke-dasharray="4 3"
                    opacity="0.65" style="pointer-events: none"
                />
            {/each}

            {#each floor.labels as label (label.id)}
                {@render labelNode(label)}
            {/each}
        </g>
    </svg>

    <div class="absolute right-2 bottom-2 flex flex-col gap-1.5">
        <button onclick={editor.zoomIn} aria-label="Vergrößern" title="Vergrößern (Strg + Mausrad)" class={ZOOM_BUTTON}>
            <Plus class="h-3.5 w-3.5"/>
        </button>
        <button onclick={editor.zoomOut} aria-label="Verkleinern" title="Verkleinern (Strg + Mausrad)" class={ZOOM_BUTTON}>
            <Minus class="h-3.5 w-3.5"/>
        </button>
        {#if editor.zoomed}
            <button onclick={editor.resetView} aria-label="Ansicht zurücksetzen" title="Ansicht zurücksetzen" class={ZOOM_BUTTON}>
                <RotateCcw class="h-3.5 w-3.5"/>
            </button>
        {/if}
    </div>
</div>
