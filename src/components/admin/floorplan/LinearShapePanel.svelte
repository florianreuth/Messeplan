<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import { type Floor, type Id, isLinearShape } from "../../../lib/types.ts";
    import ColorSwatches from "./ColorSwatches.svelte";
    import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH } from "./editorState.ts";
    import PropertyPanel from "./PropertyPanel.svelte";
    import StrokeWidthPicker from "./StrokeWidthPicker.svelte";

    interface Props {
        id: Id;
        floor: Floor;
        onDeselect: () => void;
    }

    let { id, floor, onDeselect }: Props = $props();
    const store = getStore();
    const shape = $derived(floor.shapes.find((item) => item.id === id));
</script>

{#if shape && isLinearShape(shape)}
    {@const isLine = shape.type === "line"}
    <PropertyPanel
        title={isLine ? "Linie" : "Pfeil"}
        onClose={onDeselect}
        deleteLabel={isLine ? "Linie löschen" : "Pfeil löschen"}
        onDelete={() => {
            store.actions.shapes.remove(floor.id, id);
            onDeselect();
        }}
    >
        <div>
            <p class="mb-2 text-xs text-slate-400">Farbe</p>
            <ColorSwatches
                value={shape.color || DEFAULT_STROKE_COLOR}
                onChange={(color) => store.actions.shapes.update(floor.id, id, { color })}
            />
        </div>

        <div>
            <p class="mb-2 text-xs text-slate-400">Stärke</p>
            <StrokeWidthPicker
                value={shape.strokeWidth || DEFAULT_STROKE_WIDTH}
                onChange={(strokeWidth) => store.actions.shapes.update(floor.id, id, { strokeWidth })}
            />
        </div>
    </PropertyPanel>
{/if}
