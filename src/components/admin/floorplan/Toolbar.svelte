<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import type { LucideIcon } from "@lucide/svelte";
    import ArrowRight from "@lucide/svelte/icons/arrow-right";
    import Minus from "@lucide/svelte/icons/minus";
    import MousePointer2 from "@lucide/svelte/icons/mouse-pointer-2";
    import Move from "@lucide/svelte/icons/move";
    import Square from "@lucide/svelte/icons/square";
    import Type from "@lucide/svelte/icons/type";
    import X from "@lucide/svelte/icons/x";
    import type { Floor } from "../../../lib/types.ts";
    import ColorSwatches from "./ColorSwatches.svelte";
    import type { EditorTool } from "./editorState.ts";
    import type { FloorEditor } from "./floorEditor.svelte.ts";
    import FloorSizeControls from "./FloorSizeControls.svelte";
    import StrokeWidthPicker from "./StrokeWidthPicker.svelte";

    let { editor, floor }: { editor: FloorEditor; floor: Floor } = $props();

    const TOOLS: Array<{ tool: EditorTool; icon: LucideIcon; label: string }> = [
        { tool: "select", icon: MousePointer2, label: "Auswählen" },
        { tool: "rect", icon: Square, label: "Fläche" },
        { tool: "arrow", icon: ArrowRight, label: "Pfeil" },
        { tool: "line", icon: Minus, label: "Linie" },
        { tool: "label", icon: Type, label: "Text" },
    ];

    const drawingLine = $derived(editor.tool === "arrow" || editor.tool === "line");
    const focus = (node: HTMLInputElement) => node.focus();
</script>

<div class="card flex flex-wrap items-center gap-3 px-4 py-3">
    <div class="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        {#each TOOLS as { tool, icon: Icon, label } (tool)}
            {@const active = editor.tool === tool && (tool !== "select" || !editor.pendingExhibitorId)}
            <button
                onclick={() => {
                    editor.tool = tool;
                    editor.pendingExhibitorId = null;
                }}
                aria-pressed={active}
                class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all {active ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'}"
            >
                <Icon class="h-4 w-4"/>
                {label}
            </button>
        {/each}
    </div>

    {#if editor.tool === "rect"}
        <span class="text-xs text-slate-400">Auf Karte ziehen, um eine Fläche aufzuspannen</span>
    {/if}

    {#if editor.tool === "label"}
        <input
            {@attach focus}
            type="text"
            bind:value={editor.labelDraft}
            class="input w-44 text-sm"
            placeholder="Beschriftungstext…"
            aria-label="Beschriftungstext"
            onkeydown={(event) => {
                if (event.key === "Escape") {
                    editor.tool = "select";
                }
            }}
        />
        <span class="text-xs text-slate-400">
            {editor.labelDraft.trim() ? "→ auf Karte klicken" : "Text eingeben, dann auf Karte klicken"}
        </span>
    {/if}

    {#if drawingLine}
        <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Farbe:</span>
            <ColorSwatches value={editor.strokeColor} onChange={(color) => (editor.strokeColor = color)} size="sm"/>
            <span class="ml-1 text-xs text-slate-500">Stärke:</span>
            <StrokeWidthPicker value={editor.strokeWidth} onChange={(width) => (editor.strokeWidth = width)} variant="inline"/>
            <span class="ml-1 text-xs text-slate-400">· Shift: 45°-Raster</span>
        </div>
    {/if}

    {#if editor.pendingExhibitorId}
        <span class="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800">
            <Move class="h-3 w-3"/>
            Klicke auf die Karte, um <strong>{editor.pendingExhibitorId}</strong> zu platzieren
            <button
                onclick={() => (editor.pendingExhibitorId = null)}
                class="ml-1 hover:text-amber-900"
                aria-label="Platzierung abbrechen"
            >
                <X class="h-3 w-3"/>
            </button>
        </span>
    {/if}

    {#key floor.id}
        <FloorSizeControls {floor}/>
    {/key}
</div>
