<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { untrack } from "svelte";
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import { type Floor, type Id, isRectShape } from "../../../lib/types.ts";
    import ColorField from "./ColorField.svelte";
    import { RECT_DEFAULTS } from "./editorState.ts";
    import PropertyPanel from "./PropertyPanel.svelte";

    interface Props {
        id: Id;
        floor: Floor;
        onDeselect: () => void;
    }

    let { id, floor, onDeselect }: Props = $props();
    const store = getStore();
    const shape = $derived(floor.shapes.find((item) => item.id === id));
    let label = $state("");

    // Reload the draft when the selection changes, not on every text change
    $effect(() => {
        const selected = id;
        label = untrack(() => {
            const current = floor.shapes.find((item) => item.id === selected);
            return current && isRectShape(current) ? current.label ?? "" : "";
        });
    });

    const saveLabel = () => store.actions.shapes.update(floor.id, id, { label });
</script>

{#if shape && isRectShape(shape)}
    <PropertyPanel
        title="Fläche"
        onClose={onDeselect}
        deleteLabel="Fläche löschen"
        onDelete={() => {
            store.actions.shapes.remove(floor.id, id);
            onDeselect();
        }}
    >
        <label class="block">
            <span class="mb-1 block text-xs text-slate-400">Beschriftung</span>
            <input
                type="text"
                bind:value={label}
                onblur={saveLabel}
                onkeydown={(event) => event.key === "Enter" && saveLabel()}
                class="input w-full text-sm"
                placeholder="z.B. Verwaltungsbereich"
            />
        </label>

        <div class="grid grid-cols-2 gap-2">
            <ColorField
                label="Füllfarbe"
                value={shape.fill || RECT_DEFAULTS.fill}
                onChange={(fill) => store.actions.shapes.update(floor.id, id, { fill })}
            />
            <ColorField
                label="Rahmenfarbe"
                value={shape.stroke || RECT_DEFAULTS.stroke}
                onChange={(stroke) => store.actions.shapes.update(floor.id, id, { stroke })}
            />
        </div>

        <div class="grid grid-cols-2 gap-2">
            <ColorField
                label="Textfarbe"
                value={shape.textColor || RECT_DEFAULTS.textColor}
                onChange={(textColor) => store.actions.shapes.update(floor.id, id, { textColor })}
            />
            <label class="block">
                <span class="mb-1 block text-xs text-slate-400">Schriftgröße</span>
                <input
                    type="number" min="8" max="72"
                    value={shape.fontSize || RECT_DEFAULTS.fontSize}
                    oninput={(event) => store.actions.shapes.update(floor.id, id, {
                        fontSize: parseInt(event.currentTarget.value, 10) || RECT_DEFAULTS.fontSize,
                    })}
                    class="input w-full text-sm"
                />
            </label>
        </div>

        <p class="text-xs text-slate-400">Ziehe an der unteren rechten Ecke zum Skalieren.</p>
    </PropertyPanel>
{/if}
