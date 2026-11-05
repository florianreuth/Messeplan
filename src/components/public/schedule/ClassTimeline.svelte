<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import type { ClassScheduleEntry, TimeSlot } from "../../../lib/types.ts";

    export interface TimelineRow {
        slot: TimeSlot;
        entries: ClassScheduleEntry[];
    }
</script>

<script lang="ts">
    import CalendarDays from "@lucide/svelte/icons/calendar-days";
    import { tintStyle } from "../../../lib/colors.ts";
    import { scheduleType } from "../../../lib/scheduleTypes.ts";
    import type { Exhibitor, Group, Id } from "../../../lib/types.ts";

    interface Props {
        rows: TimelineRow[];
        groups: Group[];
        exhibitors: Exhibitor[];
        onSelectStand: (id: Id) => void;
    }

    const NEUTRAL_ACCENT = "#cbd5e1";

    let { rows, groups, exhibitors, onSelectStand }: Props = $props();

    const findGroup = (id: Id) => groups.find((group) => group.id === id);
</script>

{#if rows.length === 0}
    <div class="card p-8 text-center text-slate-400 dark:text-neutral-400">
        <CalendarDays class="mx-auto mb-2 h-8 w-8 opacity-40"/>
        <p class="text-sm">Für diese Klasse wurde noch kein Zeitplan eingetragen.</p>
    </div>
{:else}
    <div class="max-w-3xl animate-slide-up">
        {#each rows as { slot, entries } (slot.id)}
            {@const accent = (entries.length > 0 ? findGroup(entries[0].zoneId)?.color : undefined) ?? NEUTRAL_ACCENT}
            <div class="flex gap-3">
                <div class="w-14 shrink-0 pt-1 text-right sm:w-16">
                    <div class="tnum text-sm font-semibold text-slate-800 dark:text-neutral-200">{slot.start}</div>
                    <div class="tnum text-xs text-slate-400 dark:text-neutral-400">{slot.end}</div>
                </div>

                <div class="relative min-w-0 flex-1 border-l-2 pb-4 pl-4" style="border-color: {accent}55">
                    <span
                        class="absolute top-2 -left-[7px] h-3 w-3 rounded-full ring-4 ring-surface dark:ring-neutral-900"
                        style="background-color: {accent}"
                    ></span>

                    {#if entries.length === 0}
                        <div class="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                            <p class="text-sm text-slate-500 dark:text-neutral-400">{slot.label}</p>
                        </div>
                    {:else}
                        <div class="space-y-2">
                            {#each entries as entry (entry.id)}
                                {@const group = findGroup(entry.zoneId)}
                                {@const type = scheduleType(entry.type)}
                                {@const stands = exhibitors.filter((item) => item.groupId === entry.zoneId)}
                                <div class="card p-3.5">
                                    <div class="flex flex-wrap items-center gap-2">
                                        {#if group}
                                            <span
                                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                                                style="background-color: {group.color}"
                                            >
                                                {group.id}
                                            </span>
                                        {/if}
                                        <span class="text-sm font-semibold text-slate-900 dark:text-white">
                                            {group?.label || "Bereich unbekannt"}
                                        </span>
                                        <span
                                            class="tint ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                                            style={tintStyle(type.color)}
                                        >
                                            {type.label}
                                        </span>
                                    </div>

                                    {#if slot.label}
                                        <p class="mt-1.5 text-xs text-slate-400 dark:text-neutral-400">{slot.label}</p>
                                    {/if}

                                    {#if stands.length > 0}
                                        <div class="mt-2.5 border-t border-slate-100 pt-2.5 dark:border-white/10">
                                            <p class="tnum mb-1.5 text-xs text-slate-400 dark:text-neutral-400">
                                                {stands.length} Stände in diesem Bereich
                                            </p>
                                            <div class="flex flex-wrap gap-1.5">
                                                {#each stands as stand (stand.id)}
                                                    <button
                                                        onclick={() => onSelectStand(stand.id)}
                                                        title={stand.name}
                                                        class="tnum rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 transition-all hover:bg-navy-100 hover:text-navy-800 active:scale-95 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-neutral-600 dark:hover:text-white"
                                                    >
                                                        {stand.id}
                                                    </button>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{/if}
