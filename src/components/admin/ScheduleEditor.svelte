<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { classDisplayName } from "../../lib/classes.ts";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { scheduleEntryId } from "../../lib/data/collections.ts";
    import { isScheduleType } from "../../lib/scheduleTypes.ts";
    import type { Id, SchoolClass, ScheduleEntryType } from "../../lib/types.ts";

    const TYPE_OPTIONS: Array<{ value: ScheduleEntryType; label: string }> = [
        { value: "visit", label: "Bereich besuchen" },
        { value: "reflection", label: "Reflexion" },
        { value: "conversation", label: "Gespräche" },
        { value: "start", label: "Gemeinsamer Start" },
        { value: "break", label: "Pause" },
    ];

    let { schoolClass }: { schoolClass: SchoolClass } = $props();
    const store = getStore();

    const entryTypes = $derived(new Map(store.data.classSchedule.map((entry) => [entry.id, entry.type])));
    const entryType = (timeSlotId: Id, zoneId: Id) =>
        entryTypes.get(scheduleEntryId(schoolClass.id, timeSlotId, zoneId)) ?? "";
</script>

<div>
    <h3 class="mb-3 text-sm font-semibold text-slate-700">Zeitplan – {classDisplayName(schoolClass, store.data.tracks.find((track) => track.id === schoolClass.track))}</h3>
    <div class="overflow-x-auto">
        <table class="w-full border-collapse text-xs">
            <thead>
            <tr>
                <th class="rounded-tl bg-navy-900 px-2 py-2 text-left font-medium whitespace-nowrap text-white">Uhrzeit</th>
                {#each store.data.groups as group (group.id)}
                    <th class="min-w-[90px] bg-navy-900 px-1 py-2 text-center font-medium text-white">
                        <span class="inline-block rounded-sm px-1.5 py-0.5 text-xs font-bold" style:background-color="{group.color}80">
                            {group.id}
                        </span>
                    </th>
                {/each}
            </tr>
            </thead>
            <tbody>
            {#each store.data.timeSlots as slot, index (slot.id)}
                <tr class={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td class="border border-slate-200 px-2 py-1.5 font-mono whitespace-nowrap text-slate-600">
                        {slot.start}
                        {#if slot.label}
                            <span class="block text-xs font-normal text-slate-400">{slot.label}</span>
                        {/if}
                    </td>
                    {#each store.data.groups as group (group.id)}
                        <td class="border border-slate-200 px-1 py-1 text-center">
                            <select
                                value={entryType(slot.id, group.id)}
                                onchange={(event) => {
                                    const value = event.currentTarget.value;
                                    store.actions.schedule.set(schoolClass.id, slot.id, group.id, isScheduleType(value) ? value : null);
                                }}
                                class="w-full min-w-[80px] cursor-pointer border-0 bg-transparent text-xs focus:outline-hidden"
                                aria-label="{slot.start} {group.label}"
                            >
                                <option value="">–</option>
                                {#each TYPE_OPTIONS as option (option.value)}
                                    <option value={option.value}>{option.label}</option>
                                {/each}
                            </select>
                        </td>
                    {/each}
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
    <p class="mt-2 text-xs text-slate-400">„–" = kein Eintrag für diesen Zeitslot und Bereich.</p>
</div>
