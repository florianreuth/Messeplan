<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Minus from "@lucide/svelte/icons/minus";
    import Plus from "@lucide/svelte/icons/plus";
    import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
    import { DEFAULT_FLOOR_SIZE } from "../../lib/data/defaults.ts";
    import type { Exhibitor, Floor, Group, Id } from "../../lib/types.ts";
    import FloorPlanSvg from "./FloorPlanSvg.svelte";
    import { PanZoom } from "./panZoom.svelte.ts";

    interface Props {
        floors: Floor[];
        floorId?: Id | null;
        onFloorChange: (id: Id) => void;
        exhibitors: Exhibitor[];
        groups: Group[];
        selectedId?: Id | null;
        highlightIds?: Set<Id> | null;
        onSelect: (id: Id) => void;
    }

    const MAX_WIDTH_BASIS = "56vh";
    const ZOOM_STEP = 1.5;
    const ZOOM_BUTTON = "flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/70 bg-white/80 "
        + "text-slate-500 backdrop-blur-sm transition-all hover:text-slate-800 active:scale-95 dark:border-white/15 "
        + "dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:text-white";

    let { floors, floorId, onFloorChange, exhibitors, groups, selectedId, highlightIds, onSelect }: Props = $props();

    const floor = $derived(floors.find((item) => item.id === floorId) ?? floors[0]);
    const hasTabs = $derived(floors.length > 1);
    const panZoom = new PanZoom(() => ({
        width: floor?.width ?? DEFAULT_FLOOR_SIZE.width,
        height: floor?.height ?? DEFAULT_FLOOR_SIZE.height,
        resetKey: floor?.id,
    }));
</script>

{#if floor}
    <div class="card -mx-4 overflow-hidden rounded-none border-x-0 sm:mx-0 sm:rounded-2xl sm:border-x">
        {#if hasTabs}
            <div class="px-3 pt-2 pb-1.5 sm:px-2">
                <div class="flex w-max max-w-full scrollbar-hide gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 dark:bg-neutral-900">
                    {#each floors as item (item.id)}
                        <button
                            onclick={() => onFloorChange(item.id)}
                            aria-pressed={item.id === floor.id}
                            class="rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all {item.id === floor.id
                                ? 'bg-white text-navy-900 shadow-card dark:bg-neutral-700 dark:text-white'
                                : 'text-slate-600 hover:text-navy-800 dark:text-neutral-300 dark:hover:text-white'}"
                        >
                            {item.label}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
        <div class="bg-plan p-0 sm:p-2 dark:bg-plan-dark {hasTabs ? 'border-t border-slate-100 dark:border-white/10' : ''}">
            <div class="relative mx-auto w-full" style="max-width: calc({MAX_WIDTH_BASIS} * {floor.width / floor.height})">
                <!-- d3-zoom handles pointer gestures here; keyboard users reach booths by Tab and zoom with the buttons -->
                <div
                    {@attach panZoom.attach}
                    class="relative h-[58vh] w-full overflow-hidden sm:h-auto sm:rounded-xl"
                    style="aspect-ratio: {floor.width} / {floor.height}; touch-action: {panZoom.touchAction}"
                >
                    <div class="absolute top-0 left-0" style={panZoom.contentStyle}>
                        <FloorPlanSvg
                            {floor}
                            {exhibitors}
                            {groups}
                            {selectedId}
                            {highlightIds}
                            {onSelect}
                            class="block h-full w-full select-none"
                        />
                    </div>
                </div>

                <div class="absolute right-2 bottom-2 flex flex-col gap-1.5">
                    <button onclick={() => panZoom.zoomBy(ZOOM_STEP)} aria-label="Vergrößern" class={ZOOM_BUTTON}>
                        <Plus class="h-3.5 w-3.5"/>
                    </button>
                    <button onclick={() => panZoom.zoomBy(1 / ZOOM_STEP)} aria-label="Verkleinern" class={ZOOM_BUTTON}>
                        <Minus class="h-3.5 w-3.5"/>
                    </button>
                    {#if panZoom.zoomed}
                        <button onclick={() => panZoom.reset(true)} aria-label="Ansicht zurücksetzen" class={ZOOM_BUTTON}>
                            <RotateCcw class="h-3.5 w-3.5"/>
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
