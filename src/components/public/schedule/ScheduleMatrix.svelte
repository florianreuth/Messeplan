<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { classLabel } from "../../../lib/classes.ts";
    import { tintStyle } from "../../../lib/colors.ts";
    import { scheduleType } from "../../../lib/scheduleTypes.ts";
    import type { ClassScheduleEntry, Group, Id, SchoolClass, TimeSlot } from "../../../lib/types.ts";

    interface Props {
        timeSlots: TimeSlot[];
        groups: Group[];
        classes: SchoolClass[];
        schedule: ClassScheduleEntry[];
        onSelectClass: (id: Id) => void;
    }

    let { timeSlots, groups, classes, schedule, onSelectClass }: Props = $props();

    const classesById = $derived(new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass])));

    const cellEntries = (slotId: Id, zoneId: Id) => schedule.flatMap((entry) => {
        if (entry.timeSlotId !== slotId || entry.zoneId !== zoneId) {
            return [];
        }
        const schoolClass = classesById.get(entry.classId);
        return schoolClass ? [{ entry, schoolClass, type: scheduleType(entry.type) }] : [];
    });
</script>

<div class="card hidden overflow-hidden sm:block">
    <div class="border-b border-slate-100 px-4 py-3 dark:border-white/10">
        <h3 class="text-sm font-semibold text-navy-900 dark:text-white">Gesamtübersicht: Klassen nach Bereichen</h3>
        <p class="mt-0.5 text-xs text-slate-400 dark:text-neutral-400">Klasse anklicken, um deren Plan zu öffnen</p>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-xs">
            <thead>
            <tr class="bg-slate-50 dark:bg-white/5">
                <th class="sticky left-0 bg-slate-50 px-3 py-2.5 text-left font-semibold whitespace-nowrap text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
                    Uhrzeit
                </th>
                {#each groups as group (group.id)}
                    <th class="px-2 py-2.5 font-semibold whitespace-nowrap" style="color: {group.color}">{group.label}</th>
                {/each}
            </tr>
            </thead>
            <tbody>
            {#each timeSlots as slot, index (slot.id)}
                <tr class={index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/60 dark:bg-white/5"}>
                    <td class="tnum sticky left-0 border-r border-slate-100 bg-white px-3 py-2 font-semibold whitespace-nowrap text-slate-600 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300">
                        {slot.start}
                    </td>
                    {#each groups as group (group.id)}
                        <td class="px-1.5 py-1.5 align-top">
                            <div class="flex flex-wrap gap-1">
                                {#each cellEntries(slot.id, group.id) as { entry, schoolClass, type } (entry.id)}
                                    <button
                                        class="tint tnum inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold transition-all hover:ring-2 hover:ring-navy-200 dark:hover:ring-neutral-500"
                                        style={tintStyle(type.color)}
                                        onclick={() => onSelectClass(schoolClass.id)}
                                        title="{classLabel(schoolClass)} – {type.label}"
                                    >
                                        {classLabel(schoolClass)}
                                    </button>
                                {/each}
                            </div>
                        </td>
                    {/each}
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
</div>
