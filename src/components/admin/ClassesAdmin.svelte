<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import CalendarDays from "@lucide/svelte/icons/calendar-days";
    import Users from "@lucide/svelte/icons/users";
    import { byClassOrder, classDisplayName } from "../../lib/classes.ts";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import type { SchoolClass } from "../../lib/types.ts";
    import ConfirmModal from "../ui/ConfirmModal.svelte";
    import Modal from "../ui/Modal.svelte";
    import AdminPageHeader from "./AdminPageHeader.svelte";
    import ClassForm from "./ClassForm.svelte";
    import DataTable, { type Column } from "./DataTable.svelte";
    import EmptyTable from "./EmptyTable.svelte";
    import ScheduleEditor from "./ScheduleEditor.svelte";

    type ModalState = { kind: "form"; item: SchoolClass | null } | { kind: "delete"; item: SchoolClass } | null;

    const store = getStore();
    let modal = $state<ModalState>(null);
    let scheduleClass = $state<SchoolClass | null>(null);

    const sorted = $derived([...store.data.classes].sort(byClassOrder));
    const tracks = $derived(new Map(store.data.tracks.map((track) => [track.id, track])));
    const displayName = (schoolClass: SchoolClass) => classDisplayName(schoolClass, tracks.get(schoolClass.track));
    const totalStudents = $derived(store.data.classes.reduce((sum, item) => sum + (item.studentCount ?? 0), 0));

    function handleSave(schoolClass: SchoolClass): string | void {
        const editing = modal?.kind === "form" ? modal.item : null;
        if (editing) {
            store.actions.classes.update(editing.id, schoolClass);
        } else {
            if (store.data.classes.some((item) => item.id === schoolClass.id)) {
                return `Klassen-ID "${schoolClass.id}" existiert bereits.`;
            }
            store.actions.classes.add(schoolClass);
        }
        modal = null;
    }

    const columns: Column<SchoolClass>[] = [
        { key: "class", header: "Klasse", cell: classCell },
        { key: "students", header: "SuS", from: "sm", class: "text-slate-600", cell: studentsCell },
        { key: "teachers", header: "Lehrkräfte", from: "md", class: "text-slate-500 text-xs", cell: teachersCell },
        { key: "schedule", header: "Zeitplan", from: "lg", cell: scheduleCell },
    ];
</script>

{#snippet classCell(schoolClass: SchoolClass)}
    <div class="font-semibold text-navy-900">{displayName(schoolClass)}</div>
    <div class="text-xs text-slate-400">{tracks.get(schoolClass.track)?.label ?? schoolClass.track}</div>
    {#if schoolClass.notes}
        <p class="mt-0.5 text-xs text-slate-400">{schoolClass.notes}</p>
    {/if}
{/snippet}

{#snippet studentsCell(schoolClass: SchoolClass)}
    {schoolClass.studentCount || "—"}
{/snippet}

{#snippet teachersCell(schoolClass: SchoolClass)}
    {schoolClass.teachers?.join(", ") || "—"}
{/snippet}

{#snippet scheduleCell(schoolClass: SchoolClass)}
    <button class="flex items-center gap-1 text-xs text-navy-600 hover:underline" onclick={() => (scheduleClass = schoolClass)}>
        <CalendarDays class="h-3.5 w-3.5"/>
        {store.data.classSchedule.filter((entry) => entry.classId === schoolClass.id).length} Einträge
    </button>
{/snippet}

{#snippet scheduleAction(schoolClass: SchoolClass)}
    <button
        class="btn-ghost px-2 py-1 text-xs"
        onclick={() => (scheduleClass = schoolClass)}
        title="Zeitplan bearbeiten"
        aria-label="Zeitplan bearbeiten"
    >
        <CalendarDays class="h-3.5 w-3.5"/>
    </button>
{/snippet}

<div class="animate-fade-in space-y-4">
    <AdminPageHeader title="Klassen" subtitle="{store.data.classes.length} Klassen · {totalStudents} SuS gesamt">
        {#snippet action()}
            <button class="btn-primary" onclick={() => (modal = { kind: "form", item: null })}>+ Klasse hinzufügen</button>
        {/snippet}
    </AdminPageHeader>

    <DataTable
        {columns}
        rows={sorted}
        rowKey={(schoolClass) => schoolClass.id}
        onEdit={(item) => (modal = { kind: "form", item })}
        onDelete={(item) => (modal = { kind: "delete", item })}
        rowActions={scheduleAction}
    >
        {#snippet empty()}
            <EmptyTable icon={Users} message="Noch keine Klassen eingetragen."/>
        {/snippet}
    </DataTable>
</div>

{#if modal?.kind === "form"}
    <Modal title={modal.item ? "Klasse bearbeiten" : "Neue Klasse"} onClose={() => (modal = null)}>
        <ClassForm initial={modal.item} onSave={handleSave} onCancel={() => (modal = null)}/>
    </Modal>
{:else if modal?.kind === "delete"}
    {@const item = modal.item}
    <ConfirmModal
        message="{displayName(item)} wirklich löschen? Alle Zeitplaneinträge werden ebenfalls gelöscht."
        onConfirm={() => {
            store.actions.classes.remove(item.id);
            modal = null;
        }}
        onCancel={() => (modal = null)}
    />
{/if}

{#if scheduleClass}
    <Modal title="Zeitplan: {displayName(scheduleClass)}" onClose={() => (scheduleClass = null)} size="xl">
        <ScheduleEditor schoolClass={scheduleClass}/>
        <div class="mt-4 flex justify-end border-t border-slate-100 pt-4">
            <button class="btn-primary" onclick={() => (scheduleClass = null)}>Fertig</button>
        </div>
    </Modal>
{/if}
