<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import DoorOpen from "@lucide/svelte/icons/door-open";
    import Mic from "@lucide/svelte/icons/mic";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { DEFAULT_GROUP_COLOR } from "../../lib/colors.ts";
    import { byStartTime } from "../../lib/compare.ts";
    import { createId } from "../../lib/id.ts";
    import type { Talk } from "../../lib/types.ts";
    import ConfirmModal from "../ui/ConfirmModal.svelte";
    import Modal from "../ui/Modal.svelte";
    import AdminPageHeader from "./AdminPageHeader.svelte";
    import DataTable, { type Column } from "./DataTable.svelte";
    import EmptyTable from "./EmptyTable.svelte";
    import TalkForm, { type TalkSubmission } from "./TalkForm.svelte";

    type ModalState = { kind: "form"; item: Talk | null } | { kind: "delete"; item: Talk } | null;

    const store = getStore();
    let modal = $state<ModalState>(null);

    const sorted = $derived([...store.data.talks].sort(byStartTime));

    function handleSave({ talk, newRoomName }: TalkSubmission) {
        let roomId = talk.roomId;
        if (newRoomName) {
            roomId = createId();
            store.actions.rooms.add({ id: roomId, name: newRoomName });
        }

        const payload: Omit<Talk, "id"> = {
            exhibitorId: talk.exhibitorId || undefined,
            roomId: roomId || undefined,
            startTime: talk.startTime || undefined,
            durationMinutes: talk.durationMinutes,
            format: talk.format || undefined,
            topic: talk.topic.trim() || undefined,
            notes: talk.notes.trim() || undefined,
        };
        const editing = modal?.kind === "form" ? modal.item : null;
        if (editing) {
            store.actions.talks.update(editing.id, payload);
        } else {
            store.actions.talks.add(payload);
        }
        modal = null;
    }

    const columns: Column<Talk>[] = [
        { key: "time", header: "Zeit", class: "font-mono text-slate-600 whitespace-nowrap", cell: timeCell },
        { key: "exhibitor", header: "Aussteller", cell: exhibitorCell },
        { key: "format", header: "Format", from: "sm", class: "text-slate-600", cell: formatCell },
        { key: "room", header: "Raum", from: "md", class: "text-slate-600", cell: roomCell },
        { key: "topic", header: "Thema", from: "lg", class: "text-slate-500 max-w-48 truncate", cell: topicCell },
    ];
</script>

{#snippet timeCell(talk: Talk)}
    {talk.startTime || "—"}
    {#if talk.durationMinutes}
        <span class="ml-1 text-xs text-slate-400">({talk.durationMinutes}')</span>
    {/if}
{/snippet}

{#snippet exhibitorCell(talk: Talk)}
    {@const exhibitor = store.data.exhibitors.find((item) => item.id === talk.exhibitorId)}
    {#if exhibitor}
        {@const group = store.data.groups.find((item) => item.id === exhibitor.groupId)}
        <div class="flex items-center gap-2">
            <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-xs font-bold text-white"
                style:background-color={group?.color ?? DEFAULT_GROUP_COLOR}
            >
                {exhibitor.id}
            </span>
            <span class="hidden font-medium text-slate-800 sm:block">{exhibitor.name}</span>
        </div>
    {:else}
        <span class="text-slate-400 italic">—</span>
    {/if}
{/snippet}

{#snippet formatCell(talk: Talk)}
    {talk.format || "—"}
{/snippet}

{#snippet roomCell(talk: Talk)}
    {store.data.rooms.find((room) => room.id === talk.roomId)?.name || "—"}
{/snippet}

{#snippet topicCell(talk: Talk)}
    {talk.topic || "—"}
{/snippet}

<div class="animate-fade-in space-y-4">
    <AdminPageHeader title="Vorträge & Workshops" subtitle="{store.data.talks.length} Einträge">
        {#snippet action()}
            <button class="btn-primary" onclick={() => (modal = { kind: "form", item: null })}>+ Vortrag hinzufügen</button>
        {/snippet}
    </AdminPageHeader>

    <details class="card p-4">
        <summary class="cursor-pointer text-sm font-medium text-slate-700 select-none">
            <span class="inline-flex items-center gap-1.5">
                <DoorOpen class="h-3.5 w-3.5"/> Räume verwalten ({store.data.rooms.length})
            </span>
        </summary>
        <div class="mt-3 space-y-2">
            {#each store.data.rooms as room (room.id)}
                <div class="flex items-center gap-2 text-sm">
                    <span class="flex-1 text-slate-700">{room.name}</span>
                    {#if room.floor}
                        <span class="text-slate-400">{room.floor}. Etage</span>
                    {/if}
                    <button class="text-xs text-red-400 hover:text-red-600" onclick={() => store.actions.rooms.remove(room.id)}>
                        Löschen
                    </button>
                </div>
            {:else}
                <p class="text-xs text-slate-400">Keine Räume. Räume werden beim Hinzufügen von Vorträgen erstellt.</p>
            {/each}
        </div>
    </details>

    <DataTable
        {columns}
        rows={sorted}
        rowKey={(talk) => talk.id}
        onEdit={(item) => (modal = { kind: "form", item })}
        onDelete={(item) => (modal = { kind: "delete", item })}
    >
        {#snippet empty()}
            <EmptyTable icon={Mic} message="Noch keine Vorträge eingetragen."/>
        {/snippet}
    </DataTable>
</div>

{#if modal?.kind === "form"}
    <Modal title={modal.item ? "Vortrag bearbeiten" : "Neuer Vortrag"} onClose={() => (modal = null)}>
        <TalkForm initial={modal.item} onSave={handleSave} onCancel={() => (modal = null)}/>
    </Modal>
{:else if modal?.kind === "delete"}
    {@const item = modal.item}
    <ConfirmModal
        message="Diesen Eintrag wirklich löschen?"
        onConfirm={() => {
            store.actions.talks.remove(item.id);
            modal = null;
        }}
        onCancel={() => (modal = null)}
    />
{/if}
