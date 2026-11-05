<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import { DEFAULT_GROUP_COLOR } from "../../../lib/colors.ts";
    import type { Floor, Id } from "../../../lib/types.ts";
    import { MIN_SHAPE_SIZE } from "./editorState.ts";
    import PropertyPanel from "./PropertyPanel.svelte";

    interface Props {
        id: Id;
        floor: Floor;
        onDeselect: () => void;
    }

    let { id, floor, onDeselect }: Props = $props();
    const store = getStore();

    const exhibitor = $derived(store.data.exhibitors.find((item) => item.id === id));
    const booth = $derived(floor.booths.find((item) => item.exhibitorId === id));
    const group = $derived(store.data.groups.find((item) => item.id === exhibitor?.groupId));

    function setSize(field: "width" | "height", value: string) {
        store.actions.booths.place(floor.id, id, { [field]: Math.max(MIN_SHAPE_SIZE, parseInt(value, 10) || MIN_SHAPE_SIZE) });
    }
</script>

{#if exhibitor && booth}
    <PropertyPanel
        title="Stand"
        onClose={onDeselect}
        deleteLabel="Vom Lageplan entfernen"
        onDelete={() => {
            store.actions.booths.remove(id);
            onDeselect();
        }}
    >
        <div class="flex items-center gap-2">
            <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-bold text-white"
                style="background-color: {group?.color ?? DEFAULT_GROUP_COLOR}"
            >
                {exhibitor.id}
            </div>
            <span class="text-sm leading-tight font-medium text-slate-800">{exhibitor.name}</span>
        </div>

        <div>
            <p class="mb-2 text-xs font-medium text-slate-500">Größe</p>
            <div class="grid grid-cols-2 gap-2">
                <label class="block">
                    <span class="mb-1 block text-xs text-slate-400">Breite</span>
                    <input
                        type="number" min="20" max="300" value={booth.width}
                        oninput={(event) => setSize("width", event.currentTarget.value)}
                        class="input w-full text-sm"
                    />
                </label>
                <label class="block">
                    <span class="mb-1 block text-xs text-slate-400">Höhe</span>
                    <input
                        type="number" min="20" max="300" value={booth.height}
                        oninput={(event) => setSize("height", event.currentTarget.value)}
                        class="input w-full text-sm"
                    />
                </label>
            </div>
            <p class="mt-1 text-xs text-slate-400">Oder ziehe an der unteren rechten Ecke des Stands.</p>
        </div>
    </PropertyPanel>
{/if}
