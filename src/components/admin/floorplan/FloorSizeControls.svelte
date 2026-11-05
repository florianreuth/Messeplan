<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { untrack } from "svelte";
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import { DEFAULT_FLOOR_SIZE } from "../../../lib/data/defaults.ts";
    import type { Floor } from "../../../lib/types.ts";
    import { MIN_FLOOR_SIZE } from "./editorState.ts";

    // Keyed by floor id in the toolbar, so the drafts start from the current floor
    let { floor }: { floor: Floor } = $props();
    const store = getStore();
    let width: number | null = $state(untrack(() => floor.width));
    let height: number | null = $state(untrack(() => floor.height));

    function apply() {
        store.actions.floors.update(floor.id, {
            width: Math.max(MIN_FLOOR_SIZE.width, width || DEFAULT_FLOOR_SIZE.width),
            height: Math.max(MIN_FLOOR_SIZE.height, height || DEFAULT_FLOOR_SIZE.height),
        });
    }
</script>

<div class="ml-auto flex items-center gap-2">
    <span class="text-xs text-slate-400">Größe:</span>
    <input
        type="number" min="400" max="3000" step="50" bind:value={width}
        class="input w-20 py-1 text-xs" placeholder="1000" aria-label="Breite"
    />
    <span class="text-xs text-slate-400">×</span>
    <input
        type="number" min="300" max="2000" step="50" bind:value={height}
        class="input w-20 py-1 text-xs" placeholder="700" aria-label="Höhe"
    />
    <button onclick={apply} class="btn-secondary px-2 py-1 text-xs">Anwenden</button>
</div>
