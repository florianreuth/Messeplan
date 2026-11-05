<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import type { LucideIcon } from "@lucide/svelte";
    import BookOpen from "@lucide/svelte/icons/book-open";
    import Hammer from "@lucide/svelte/icons/hammer";
    import Hand from "@lucide/svelte/icons/hand";
    import Mic from "@lucide/svelte/icons/mic";
    import Microscope from "@lucide/svelte/icons/microscope";
    import Plane from "@lucide/svelte/icons/plane";
    import Tag from "@lucide/svelte/icons/tag";
    import Wrench from "@lucide/svelte/icons/wrench";

    const FORMAT_ICONS: Record<string, LucideIcon> = {
        "Vortrag": Mic,
        "Seminar": BookOpen,
        "Workshop": Wrench,
        "Workshop (handwerklich)": Hammer,
        "Mitmachaktion": Hand,
        "NaWi-Workshop": Microscope,
        "ATA-Simulation": Plane,
    };

    function formatIcon(format?: string): LucideIcon {
        return (format && FORMAT_ICONS[format]) || Tag;
    }
</script>

<script lang="ts">
    import Info from "@lucide/svelte/icons/info";
    import MapPin from "@lucide/svelte/icons/map-pin";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { DEFAULT_GROUP_COLOR } from "../../lib/colors.ts";
    import { byStartTime } from "../../lib/compare.ts";
    import { countBy, groupBy, matchesQuery, normalizeQuery } from "../../lib/search.ts";
    import type { Id, Talk } from "../../lib/types.ts";
    import CategoryBadge from "../ui/CategoryBadge.svelte";
    import EmptyState from "../ui/EmptyState.svelte";
    import FilterChips from "../ui/FilterChips.svelte";
    import JumpBar from "../ui/JumpBar.svelte";
    import SearchField from "../ui/SearchField.svelte";
    import Sheet from "../ui/Sheet.svelte";
    import ExhibitorDetail from "./ExhibitorDetail.svelte";

    const UNKNOWN_TIME = "??:??";

    const store = getStore();
    const data = $derived(store.data);

    let search = $state("");
    let filterRoom = $state("");
    let filterCategory = $state("");
    let filterFormat = $state("");
    let detailId = $state<Id | null>(null);

    const formats = $derived([...new Set(data.talks.map((talk) => talk.format).filter((format) => !!format))].sort() as string[]);
    const usedRooms = $derived(data.rooms.filter((room) => data.talks.some((talk) => talk.roomId === room.id)));
    const formatCounts = $derived(countBy(data.talks, (talk) => talk.format));
    const query = $derived(normalizeQuery(search));

    const filtered = $derived(data.talks
        .filter((talk) => {
            const exhibitor = data.exhibitors.find((item) => item.id === talk.exhibitorId);
            if (filterRoom && talk.roomId !== filterRoom) {
                return false;
            }
            if (filterCategory && exhibitor?.categoryId !== filterCategory) {
                return false;
            }
            if (filterFormat && talk.format !== filterFormat) {
                return false;
            }
            return matchesQuery(query, [talk.topic, talk.format, talk.speakerName, exhibitor?.name, exhibitor?.id]);
        })
        .sort(byStartTime));

    const byTime = $derived(groupBy(filtered, (talk) => talk.startTime || UNKNOWN_TIME));
    const times = $derived(Object.keys(byTime).sort());
    const isFiltering = $derived(!!query || !!filterRoom || !!filterCategory || !!filterFormat);
    const detailExhibitor = $derived(detailId ? data.exhibitors.find((item) => item.id === detailId) : undefined);

    function resetFilters() {
        search = "";
        filterRoom = "";
        filterCategory = "";
        filterFormat = "";
    }
</script>

{#snippet talkCard(talk: Talk)}
    {@const exhibitor = data.exhibitors.find((item) => item.id === talk.exhibitorId)}
    {@const group = exhibitor ? data.groups.find((item) => item.id === exhibitor.groupId) : undefined}
    {@const room = data.rooms.find((item) => item.id === talk.roomId)}
    {@const FormatIcon = formatIcon(talk.format)}
    <button
        onclick={() => exhibitor && (detailId = exhibitor.id)}
        disabled={!exhibitor}
        class="card content-auto w-full p-3.5 text-left transition-all enabled:hover:border-navy-200 enabled:hover:shadow-lift enabled:active:scale-[0.99] disabled:cursor-default dark:enabled:hover:border-neutral-500"
    >
        <div class="mb-2 flex items-center gap-2">
            <FormatIcon class="h-4 w-4 shrink-0 text-navy-500"/>
            <span class="truncate text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-neutral-400">
                {talk.format || "Vortrag"}
            </span>
            {#if talk.durationMinutes && talk.durationMinutes > 0}
                <span class="tnum shrink-0 text-xs text-slate-400 dark:text-neutral-400">{talk.durationMinutes} Min.</span>
            {/if}
            {#if exhibitor}
                <span class="ml-auto shrink-0"><CategoryBadge categoryId={exhibitor.categoryId} size="xs"/></span>
            {/if}
        </div>

        {#if exhibitor}
            <div class="flex items-center gap-2">
                <span
                    class="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style="background-color: {group?.color ?? DEFAULT_GROUP_COLOR}"
                >
                    {exhibitor.id}
                </span>
                <span class="text-sm leading-snug font-semibold text-slate-900 dark:text-white">{exhibitor.name}</span>
            </div>
        {:else}
            <p class="text-sm text-slate-400 italic dark:text-neutral-400">Kein Aussteller zugewiesen</p>
        {/if}

        {#if talk.topic}
            <p class="mt-2 text-sm text-slate-600 dark:text-neutral-300">{talk.topic}</p>
        {/if}

        {#if room}
            <div class="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                <MapPin class="h-3 w-3 shrink-0"/>
                <span>{room.name}</span>
                {#if room.floor}
                    <span>· {room.floor}. Etage</span>
                {/if}
            </div>
        {/if}

        {#if talk.notes}
            <div class="mt-2 flex items-start gap-1.5 rounded-lg bg-gold-50 px-2 py-1.5 text-xs text-gold-600 dark:bg-gold-400/10 dark:text-gold-400">
                <Info class="mt-0.5 h-3 w-3 shrink-0"/>
                <span>{talk.notes}</span>
            </div>
        {/if}
    </button>
{/snippet}

{#if data.talks.length === 0}
    <EmptyState
        icon={Mic}
        title="Noch keine Vorträge eingetragen"
        description="Im Admin-Bereich können Vorträge und Workshops mit Zeiten, Räumen und Formaten konfiguriert werden."
    />
{:else}
    <div class="animate-fade-in">
        <div class="mb-3">
            <h2 class="section-title">Vortragsprogramm</h2>
            <p class="tnum mt-0.5 text-sm text-slate-500 dark:text-neutral-400">
                {isFiltering
                    ? `${filtered.length} von ${data.talks.length} Beiträgen`
                    : `${data.talks.length} Vorträge und Workshops`}
            </p>
        </div>

        <div class="mb-5 space-y-3">
            <SearchField bind:value={search} placeholder="Thema oder Aussteller suchen…"/>

            {#if formats.length > 1}
                <FilterChips
                    allLabel="Alle Formate"
                    bind:value={filterFormat}
                    chips={formats.map((format) => ({
                        value: format,
                        label: format,
                        count: formatCounts[format] ?? 0,
                        icon: formatIcon(format),
                    }))}
                />
            {/if}

            <FilterChips
                allLabel="Alle Kategorien"
                bind:value={filterCategory}
                chips={data.categories.map((category) => ({ value: category.id, label: category.label, color: category.color }))}
            />

            {#if usedRooms.length > 0}
                <select bind:value={filterRoom} aria-label="Raum filtern" class="input h-12 sm:w-auto">
                    <option value="">Alle Räume</option>
                    {#each usedRooms as room (room.id)}
                        <option value={room.id}>{room.name}</option>
                    {/each}
                </select>
            {/if}

            <JumpBar label="Springe zu" targets={times.map((time) => ({ id: `zeit-${time}`, label: time }))}/>
        </div>

        {#if filtered.length === 0}
            <EmptyState
                icon={Tag}
                iconSize="h-10 w-10"
                title="Keine Ergebnisse"
                description="Versuche einen anderen Suchbegriff oder entferne die Filter."
            >
                {#snippet action()}
                    <button class="btn-secondary" onclick={resetFilters}>Filter zurücksetzen</button>
                {/snippet}
            </EmptyState>
        {:else}
            <div class="space-y-6">
                {#each times as time (time)}
                    <section id="zeit-{time}" class="scroll-mt-24">
                        <div class="mb-2.5 flex items-center gap-3">
                            <span class="tnum rounded-full bg-navy-900 px-3.5 py-1.5 text-sm font-semibold text-white dark:bg-neutral-700">
                                {time} Uhr
                            </span>
                            <span class="tnum shrink-0 text-xs text-slate-400 dark:text-neutral-400">
                                {byTime[time].length === 1 ? "1 Beitrag" : `${byTime[time].length} Beiträge`}
                            </span>
                            <div class="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
                        </div>

                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {#each byTime[time] as talk (talk.id)}
                                {@render talkCard(talk)}
                            {/each}
                        </div>
                    </section>
                {/each}
            </div>
        {/if}

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
