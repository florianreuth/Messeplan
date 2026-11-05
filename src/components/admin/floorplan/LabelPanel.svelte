<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { untrack } from "svelte";
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import type { Floor, Id } from "../../../lib/types.ts";
    import ColorField from "./ColorField.svelte";
    import { LABEL_DEFAULTS } from "./editorState.ts";
    import PropertyPanel from "./PropertyPanel.svelte";

    interface Props {
        id: Id;
        floor: Floor;
        onDeselect: () => void;
    }

    let { id, floor, onDeselect }: Props = $props();
    const store = getStore();
    const label = $derived(floor.labels.find((item) => item.id === id));
    let text = $state("");

    // Reload the draft when the selection changes, not on every text change
    $effect(() => {
        const selected = id;
        text = untrack(() => floor.labels.find((item) => item.id === selected)?.text ?? "");
    });

    const saveText = () => store.actions.labels.update(floor.id, id, { text });
</script>

{#if label}
    <PropertyPanel
        title="Beschriftung"
        onClose={onDeselect}
        deleteLabel="Beschriftung löschen"
        onDelete={() => {
            store.actions.labels.remove(floor.id, id);
            onDeselect();
        }}
    >
        <label class="block">
            <span class="mb-1 block text-xs text-slate-400">Text</span>
            <input
                type="text"
                bind:value={text}
                onblur={saveText}
                onkeydown={(event) => event.key === "Enter" && saveText()}
                class="input w-full text-sm"
            />
        </label>

        <div class="grid grid-cols-2 gap-2">
            <label class="block">
                <span class="mb-1 block text-xs text-slate-400">Schriftgröße</span>
                <input
                    type="number" min="8" max="72" value={label.fontSize || LABEL_DEFAULTS.fontSize}
                    oninput={(event) => store.actions.labels.update(floor.id, id, {
                        fontSize: parseInt(event.currentTarget.value, 10) || LABEL_DEFAULTS.fontSize,
                    })}
                    class="input w-full text-sm"
                />
            </label>
            <ColorField
                label="Farbe"
                value={label.color || LABEL_DEFAULTS.color}
                onChange={(color) => store.actions.labels.update(floor.id, id, { color })}
            />
        </div>
    </PropertyPanel>
{/if}
