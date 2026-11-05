<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { classLabel, groupClassesByYear } from "../../../lib/classes.ts";
    import type { Id, SchoolClass } from "../../../lib/types.ts";

    interface Props {
        classes: SchoolClass[];
        value: string;
        onChange: (id: Id) => void;
    }

    let { classes, value, onChange }: Props = $props();
    const byYear = $derived(groupClassesByYear(classes));
</script>

<div class="card mb-5 p-4">
    <label class="label sm:hidden" for="class-select">Klasse auswählen</label>
    <p class="label hidden sm:block">Klasse auswählen</p>

    <select
        id="class-select"
        {value}
        onchange={(event) => onChange(event.currentTarget.value)}
        class="input mt-1 h-12 sm:hidden"
    >
        <option value="">— Klasse wählen —</option>
        {#each byYear as group (group.year)}
            <optgroup label="Jahrgang {group.year}">
                {#each group.classes as schoolClass (schoolClass.id)}
                    <option value={schoolClass.id}>
                        {classLabel(schoolClass)}{schoolClass.studentCount ? ` · ${schoolClass.studentCount} SuS` : ""}
                    </option>
                {/each}
            </optgroup>
        {/each}
    </select>

    <div class="mt-2 hidden space-y-3 sm:block">
        {#each byYear as group (group.year)}
            <div>
                <p class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-neutral-400">
                    Jahrgang {group.year}
                </p>
                <div class="flex flex-wrap gap-2">
                    {#each group.classes as schoolClass (schoolClass.id)}
                        <button onclick={() => onChange(schoolClass.id)} class="chip chip-idle tnum">
                            {classLabel(schoolClass)}
                            {#if schoolClass.studentCount && schoolClass.studentCount > 0}
                                <span class="text-xs text-slate-400 dark:text-neutral-400">{schoolClass.studentCount}</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    <p class="mt-3 text-xs text-slate-400 dark:text-neutral-400">Die Auswahl wird auf diesem Gerät gespeichert.</p>
</div>
