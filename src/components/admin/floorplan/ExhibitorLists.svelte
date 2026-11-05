<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import X from "@lucide/svelte/icons/x";
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import { DEFAULT_GROUP_COLOR } from "../../../lib/colors.ts";
    import type { Exhibitor, Id } from "../../../lib/types.ts";

    interface Props {
        pendingExhibitorId: Id | null;
        onPendingChange: (id: Id | null) => void;
    }

    let { pendingExhibitorId, onPendingChange }: Props = $props();
    const store = getStore();

    const floors = $derived(store.data.floorPlan.floors);
    const placedIds = $derived(new Set(floors.flatMap((floor) => floor.booths.map((booth) => booth.exhibitorId))));
    const unplaced = $derived(store.data.exhibitors.filter((exhibitor) => !placedIds.has(exhibitor.id)));
    const placed = $derived(store.data.exhibitors.filter((exhibitor) => placedIds.has(exhibitor.id)));

    const groupColor = (exhibitor: Exhibitor) =>
        store.data.groups.find((group) => group.id === exhibitor.groupId)?.color ?? DEFAULT_GROUP_COLOR;

    const floorLabelOf = (exhibitorId: Id) =>
        floors.find((floor) => floor.booths.some((booth) => booth.exhibitorId === exhibitorId))?.label ?? "";
</script>

{#snippet badge(exhibitor: Exhibitor)}
    <span
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-xs font-bold text-white"
        style="background-color: {groupColor(exhibitor)}"
    >
        {exhibitor.id}
    </span>
{/snippet}

<div class="space-y-3">
    <div class="card p-3">
        <h3 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Nicht platziert ({unplaced.length})
        </h3>
        {#if unplaced.length === 0}
            <p class="text-xs text-slate-400">Alle Aussteller sind platziert.</p>
        {:else}
            <div class="max-h-48 space-y-1 overflow-y-auto pr-1">
                {#each unplaced as exhibitor (exhibitor.id)}
                    {@const selected = pendingExhibitorId === exhibitor.id}
                    <button
                        onclick={() => onPendingChange(selected ? null : exhibitor.id)}
                        aria-pressed={selected}
                        class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all {selected ? 'bg-navy-900 text-white' : 'text-slate-700 hover:bg-slate-100'}"
                    >
                        {@render badge(exhibitor)}
                        <span class="truncate">{exhibitor.name}</span>
                        {#if selected}
                            <ChevronRight class="ml-auto h-3 w-3 shrink-0"/>
                        {/if}
                    </button>
                {/each}
            </div>
            <p class="mt-2 text-xs leading-tight text-slate-400">Aussteller auswählen → auf Karte klicken</p>
        {/if}
    </div>

    {#if placed.length > 0}
        <div class="card p-3">
            <h3 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Platziert ({placed.length})
            </h3>
            <div class="max-h-48 space-y-1 overflow-y-auto pr-1">
                {#each placed as exhibitor (exhibitor.id)}
                    <div class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700">
                        {@render badge(exhibitor)}
                        <span class="flex-1 truncate">{exhibitor.name}</span>
                        {#if floors.length > 1}
                            <span class="shrink-0 text-xs text-slate-400">{floorLabelOf(exhibitor.id)}</span>
                        {/if}
                        <button
                            class="shrink-0 rounded-sm p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                            onclick={() => store.actions.booths.remove(exhibitor.id)}
                            title="Entfernen"
                            aria-label="{exhibitor.name} vom Lageplan entfernen"
                        >
                            <X class="h-3 w-3"/>
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
