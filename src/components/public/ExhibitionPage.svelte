<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Building2 from "@lucide/svelte/icons/building-complex";
    import MapPin from "@lucide/svelte/icons/map-pin";
    import Mic from "@lucide/svelte/icons/mic";
    import Search from "@lucide/svelte/icons/search";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { DEFAULT_GROUP_COLOR } from "../../lib/colors.ts";
    import { byStandNumber } from "../../lib/compare.ts";
    import { contentFloors } from "../../lib/floors.ts";
    import { countBy, groupBy, matchesQuery, normalizeQuery } from "../../lib/search.ts";
    import type { Exhibitor, Group, Id } from "../../lib/types.ts";
    import FloorPlanCard from "../floorplan/FloorPlanCard.svelte";
    import CategoryBadge from "../ui/CategoryBadge.svelte";
    import EmptyState from "../ui/EmptyState.svelte";
    import FilterChips from "../ui/FilterChips.svelte";
    import SearchField from "../ui/SearchField.svelte";
    import Sheet from "../ui/Sheet.svelte";
    import ExhibitorDetail from "./ExhibitorDetail.svelte";

    const store = getStore();
    const data = $derived(store.data);

    let search = $state("");
    let activeCategory = $state("");
    let detailId = $state<Id | null>(null);
    let mapFloorId = $state<Id | null>(null);

    const floors = $derived(contentFloors(data.floorPlan.floors));
    const activeFloor = $derived(floors.find((floor) => floor.id === mapFloorId) ?? floors[0]);
    const query = $derived(normalizeQuery(search));

    const filtered = $derived(data.exhibitors.filter((exhibitor) =>
        (!activeCategory || exhibitor.categoryId === activeCategory) && matchesQuery(query, [exhibitor.name, exhibitor.id])));

    const talkCounts = $derived(countBy(data.talks, (talk) => talk.exhibitorId));
    const categoryCounts = $derived(countBy(data.exhibitors, (exhibitor) => exhibitor.categoryId));

    const byGroup = $derived.by(() => {
        const groups = groupBy(filtered, (exhibitor) => exhibitor.groupId ?? "");
        for (const list of Object.values(groups)) {
            list.sort(byStandNumber);
        }
        return groups;
    });

    const isFiltering = $derived(!!query || !!activeCategory);
    const highlightIds = $derived(isFiltering ? new Set(filtered.map((exhibitor) => exhibitor.id)) : null);
    const detailExhibitor = $derived(detailId ? data.exhibitors.find((item) => item.id === detailId) : undefined);
    const groupsWithHits = $derived(data.groups.filter((group) => (byGroup[group.id] ?? []).length > 0));

    function resetFilters() {
        search = "";
        activeCategory = "";
    }
</script>

{#snippet exhibitorCard(exhibitor: Exhibitor, group: Group)}
    <button
        onclick={() => (detailId = exhibitor.id)}
        class="card content-auto w-full p-3.5 text-left transition-all hover:border-navy-200 hover:shadow-lift active:scale-[0.99] dark:hover:border-neutral-500"
    >
        <div class="flex items-start gap-3">
            <div
                class="tnum flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl font-display text-sm font-bold text-white"
                style="background-color: {group.color || DEFAULT_GROUP_COLOR}"
            >
                {#if exhibitor.logoUrl}
                    <img src={exhibitor.logoUrl} alt="" width="44" height="44" class="h-full w-full object-cover"/>
                {:else}
                    {exhibitor.id}
                {/if}
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-sm leading-snug font-semibold text-slate-900 dark:text-white">{exhibitor.name}</p>
                <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span class="tnum text-xs font-semibold text-slate-400 dark:text-neutral-400">Stand {exhibitor.id}</span>
                    <CategoryBadge categoryId={exhibitor.categoryId} size="xs"/>
                    {#if (talkCounts[exhibitor.id] ?? 0) > 0}
                        <span class="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-xs text-navy-600 dark:bg-white/5 dark:text-neutral-300">
                            <Mic class="h-3 w-3"/>
                            {talkCounts[exhibitor.id]}
                        </span>
                    {/if}
                </div>
                {#if exhibitor.locationNote}
                    <p class="mt-1.5 flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400">
                        <MapPin class="h-3 w-3 shrink-0"/>
                        <span class="truncate">{exhibitor.locationNote}</span>
                    </p>
                {/if}
            </div>
        </div>
    </button>
{/snippet}

{#if data.exhibitors.length === 0}
    <EmptyState
        icon={Building2}
        title="Noch keine Aussteller eingetragen"
        description="Im Admin-Bereich können Aussteller, Gruppen und Kategorien konfiguriert werden."
    />
{:else}
    <div class="animate-fade-in">
        {#if activeFloor}
            <section class="mb-8">
                <div class="mb-3">
                    <h2 class="section-title">Lageplan</h2>
                    <p class="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">Stand antippen für Details, wischen und zoomen</p>
                </div>
                <FloorPlanCard
                    {floors}
                    floorId={activeFloor.id}
                    onFloorChange={(id) => (mapFloorId = id)}
                    exhibitors={data.exhibitors}
                    groups={data.groups}
                    selectedId={detailId}
                    {highlightIds}
                    onSelect={(id) => (detailId = id)}
                />
            </section>
        {/if}

        <section>
            <div class="mb-3">
                <h2 class="section-title">Aussteller</h2>
                <p class="tnum mt-0.5 text-sm text-slate-500 dark:text-neutral-400">
                    {isFiltering
                        ? `${filtered.length} von ${data.exhibitors.length} Ausstellern`
                        : `${data.exhibitors.length} Aussteller in ${data.groups.length} Bereichen`}
                </p>
            </div>

            <div class="mb-5 space-y-3">
                <SearchField bind:value={search} placeholder="Name oder Standnummer suchen…"/>
                <FilterChips
                    allLabel="Alle"
                    bind:value={activeCategory}
                    chips={data.categories.map((category) => ({
                        value: category.id,
                        label: category.label,
                        count: categoryCounts[category.id] ?? 0,
                        color: category.color,
                    }))}
                />
            </div>

            {#if filtered.length === 0}
                <EmptyState
                    icon={Search}
                    iconSize="h-10 w-10"
                    title="Keine Ergebnisse"
                    description="Versuche einen anderen Suchbegriff oder entferne den Filter."
                >
                    {#snippet action()}
                        <button class="btn-secondary" onclick={resetFilters}>Filter zurücksetzen</button>
                    {/snippet}
                </EmptyState>
            {:else}
                <div class="space-y-7">
                    {#each groupsWithHits as group (group.id)}
                        {@const items = byGroup[group.id]}
                        <section id="bereich-{group.id}" class="scroll-mt-24">
                            <div class="mb-3 flex items-center gap-3">
                                <div class="zone-badge" style="background-color: {group.color}">{group.id}</div>
                                <div>
                                    <h3 class="font-display text-lg leading-tight text-navy-900 sm:text-xl dark:text-white">{group.label}</h3>
                                    <p class="tnum text-xs text-slate-400 dark:text-neutral-400">{items.length} Aussteller</p>
                                </div>
                                <div class="ml-1 h-px flex-1" style="background-color: {group.color}33"></div>
                            </div>

                            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {#each items as exhibitor (exhibitor.id)}
                                    {@render exhibitorCard(exhibitor, group)}
                                {/each}
                            </div>
                        </section>
                    {/each}
                </div>
            {/if}
        </section>

        {#if detailExhibitor}
            <Sheet title="Stand {detailExhibitor.id}" onClose={() => (detailId = null)}>
                <ExhibitorDetail
                    exhibitor={detailExhibitor}
                    group={data.groups.find((group) => group.id === detailExhibitor.groupId)}
                />
            </Sheet>
        {/if}
    </div>
{/if}
