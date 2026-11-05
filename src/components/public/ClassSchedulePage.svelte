<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import ClipboardList from "@lucide/svelte/icons/clipboard-list";
    import Repeat from "@lucide/svelte/icons/repeat";
    import Users from "@lucide/svelte/icons/users";
    import { IsMounted, PersistedState } from "runed";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { classLabel } from "../../lib/classes.ts";
    import type { Id } from "../../lib/types.ts";
    import EmptyState from "../ui/EmptyState.svelte";
    import Sheet from "../ui/Sheet.svelte";
    import ExhibitorDetail from "./ExhibitorDetail.svelte";
    import ClassPicker from "./schedule/ClassPicker.svelte";
    import ClassTimeline, { type TimelineRow } from "./schedule/ClassTimeline.svelte";
    import ScheduleMatrix from "./schedule/ScheduleMatrix.svelte";

    const store = getStore();
    const data = $derived(store.data);

    const CLASS_KEY = "messeplan-class";

    // Browsers that block all site data throw on storage access; the choice then just lasts for this visit
    function persistedClass(): { current: string } {
        try {
            return new PersistedState(CLASS_KEY, "");
        } catch {
            let current = $state("");
            return {
                get current() {
                    return current;
                },
                set current(value) {
                    current = value;
                },
            };
        }
    }

    const storedClass = persistedClass();
    const mounted = new IsMounted();
    let detailId = $state<Id | null>(null);

    // Applied after mount: the server cannot know the stored class, so using it earlier would break hydration
    const selectedClass = $derived(mounted.current ? storedClass.current : "");

    function selectClass(id: Id) {
        storedClass.current = id;
    }

    const schoolClass = $derived(selectedClass ? data.classes.find((item) => item.id === selectedClass) : undefined);

    const timeline = $derived.by<TimelineRow[]>(() => {
        if (!schoolClass) {
            return [];
        }
        return data.timeSlots
            .map((slot) => ({
                slot,
                entries: data.classSchedule.filter((entry) => entry.classId === schoolClass.id && entry.timeSlotId === slot.id),
            }))
            .filter((row) => row.entries.length > 0 || row.slot.label);
    });

    const detailExhibitor = $derived(detailId ? data.exhibitors.find((item) => item.id === detailId) : undefined);
</script>

{#if data.classes.length === 0}
    <EmptyState
        icon={ClipboardList}
        title="Noch keine Klassen eingetragen"
        description="Im Admin-Bereich können Klassen und deren Zeitpläne konfiguriert werden."
    />
{:else}
    <div class="animate-fade-in">
        <div class="mb-3">
            <h2 class="section-title">Klassenplan</h2>
            <p class="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">
                {schoolClass ? "Dein Tagesablauf auf der Messe" : "Wähle deine Klasse für den persönlichen Zeitplan"}
            </p>
        </div>

        {#if schoolClass}
            <div class="card mb-5 flex max-w-3xl items-center gap-3 p-4">
                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 font-display text-lg font-bold text-white dark:bg-neutral-700">
                    {classLabel(schoolClass)}
                </div>
                <div class="min-w-0">
                    <p class="font-semibold text-slate-900 dark:text-white">Klasse {classLabel(schoolClass)}</p>
                    <div class="mt-0.5 space-y-0.5 text-xs text-slate-500 dark:text-neutral-400">
                        {#if schoolClass.studentCount && schoolClass.studentCount > 0}
                            <p class="flex items-center gap-1.5">
                                <Users class="h-3.5 w-3.5 text-slate-400"/>
                                <span class="tnum">{schoolClass.studentCount} Schülerinnen und Schüler</span>
                            </p>
                        {/if}
                        {#if schoolClass.teachers?.length}
                            <p class="truncate">Begleitung: {schoolClass.teachers.join(", ")}</p>
                        {/if}
                    </div>
                </div>
                <button class="btn-ghost ml-auto shrink-0" onclick={() => selectClass("")}>
                    <Repeat class="h-4 w-4"/>
                    <span class="hidden sm:inline">Andere Klasse</span>
                    <span class="sr-only sm:hidden">Andere Klasse</span>
                </button>
            </div>
            <ClassTimeline
                rows={timeline}
                groups={data.groups}
                exhibitors={data.exhibitors}
                onSelectStand={(id) => (detailId = id)}
            />
        {:else}
            <ClassPicker classes={data.classes} value={selectedClass} onChange={selectClass}/>

            <div class="card p-6 text-center text-sm text-slate-500 sm:hidden dark:text-neutral-400">
                <ClipboardList class="mx-auto mb-2 h-7 w-7 opacity-40"/>
                <p>Wähle oben deine Klasse aus, um deinen persönlichen Zeitplan zu sehen.</p>
            </div>

            <ScheduleMatrix
                timeSlots={data.timeSlots}
                groups={data.groups}
                classes={data.classes}
                schedule={data.classSchedule}
                onSelectClass={selectClass}
            />
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
