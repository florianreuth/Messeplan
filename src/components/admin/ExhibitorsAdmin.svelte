<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Building2 from "@lucide/svelte/icons/building-complex";
    import MapPin from "@lucide/svelte/icons/map-pin";
    import Search from "@lucide/svelte/icons/search";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { DEFAULT_GROUP_COLOR } from "../../lib/colors.ts";
    import { byGroupAndStand } from "../../lib/compare.ts";
    import { matchesQuery, normalizeQuery } from "../../lib/search.ts";
    import type { Exhibitor } from "../../lib/types.ts";
    import CategoryBadge from "../ui/CategoryBadge.svelte";
    import ConfirmModal from "../ui/ConfirmModal.svelte";
    import Modal from "../ui/Modal.svelte";
    import AdminPageHeader from "./AdminPageHeader.svelte";
    import DataTable, { type Column } from "./DataTable.svelte";
    import EmptyTable from "./EmptyTable.svelte";
    import ExhibitorForm from "./ExhibitorForm.svelte";

    type ModalState = { kind: "form"; item: Exhibitor | null } | { kind: "delete"; item: Exhibitor } | null;

    const store = getStore();
    const uid = $props.id();

    let search = $state("");
    let filterGroup = $state("");
    let modal = $state<ModalState>(null);

    const filtered = $derived.by(() => {
        const query = normalizeQuery(search);
        return store.data.exhibitors
            .filter((exhibitor) => (!filterGroup || exhibitor.groupId === filterGroup)
                && matchesQuery(query, [exhibitor.name, exhibitor.id]))
            .sort(byGroupAndStand);
    });

    const groupColor = (exhibitor: Exhibitor) =>
        store.data.groups.find((group) => group.id === exhibitor.groupId)?.color ?? DEFAULT_GROUP_COLOR;

    function handleSave(exhibitor: Exhibitor): string | void {
        const previous = modal?.kind === "form" ? modal.item : null;
        if (store.data.exhibitors.some((item) => item.id === exhibitor.id && item.id !== previous?.id)) {
            return `Stand-ID "${exhibitor.id}" existiert bereits. Bitte andere Stand-ID wählen.`;
        }
        if (previous) {
            store.actions.exhibitors.update(previous.id, exhibitor);
        } else {
            store.actions.exhibitors.add(exhibitor);
        }
        modal = null;
    }

    const columns: Column<Exhibitor>[] = [
        { key: "id", header: "ID", cell: idCell },
        { key: "name", header: "Name", cell: nameCell },
        { key: "category", header: "Kategorie", from: "sm", cell: categoryCell },
        { key: "contact", header: "Kontakt", from: "md", cell: contactCell },
    ];
</script>

{#snippet idCell(exhibitor: Exhibitor)}
    <span
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
        style:background-color={groupColor(exhibitor)}
    >
        {exhibitor.id}
    </span>
{/snippet}

{#snippet nameCell(exhibitor: Exhibitor)}
    <div class="flex items-center gap-2">
        {#if exhibitor.logoUrl}
            <img src={exhibitor.logoUrl} alt="" class="h-7 w-7 rounded-sm border border-slate-200 object-contain"/>
        {/if}
        <div>
            <p class="font-medium text-slate-800">{exhibitor.name}</p>
            {#if exhibitor.locationNote}
                <p class="flex items-center gap-0.5 text-xs text-amber-600">
                    <MapPin class="h-3 w-3"/>{exhibitor.locationNote}
                </p>
            {/if}
        </div>
    </div>
{/snippet}

{#snippet categoryCell(exhibitor: Exhibitor)}
    <CategoryBadge categoryId={exhibitor.categoryId}/>
{/snippet}

{#snippet contactCell(exhibitor: Exhibitor)}
    <p class="text-slate-600">{exhibitor.contact || "—"}</p>
    {#if exhibitor.contactEmail}
        <p class="text-xs text-slate-400">{exhibitor.contactEmail}</p>
    {/if}
{/snippet}

<div class="animate-fade-in space-y-4">
    <AdminPageHeader title="Aussteller" subtitle="{store.data.exhibitors.length} Aussteller eingetragen">
        {#snippet action()}
            <button class="btn-primary" onclick={() => (modal = { kind: "form", item: null })}>+ Aussteller hinzufügen</button>
        {/snippet}
    </AdminPageHeader>

    <div class="flex flex-wrap gap-2">
        <div class="relative min-w-48 flex-1">
            <Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"/>
            <input type="text" placeholder="Suchen…" aria-label="Aussteller suchen" bind:value={search} class="input pl-9 text-sm"/>
        </div>
        <label class="sr-only" for="{uid}-group">Bereich filtern</label>
        <select id="{uid}-group" bind:value={filterGroup} class="input w-auto text-sm">
            <option value="">Alle Bereiche</option>
            {#each store.data.groups as group (group.id)}
                <option value={group.id}>{group.label}</option>
            {/each}
        </select>
    </div>

    <DataTable
        {columns}
        rows={filtered}
        rowKey={(exhibitor) => exhibitor.id}
        onEdit={(item) => (modal = { kind: "form", item })}
        onDelete={(item) => (modal = { kind: "delete", item })}
    >
        {#snippet empty()}
            <EmptyTable
                icon={Building2}
                message={store.data.exhibitors.length === 0 ? "Noch keine Aussteller eingetragen." : "Keine Ergebnisse."}
            />
        {/snippet}
    </DataTable>
</div>

{#if modal?.kind === "form"}
    <Modal title={modal.item ? `${modal.item.name} bearbeiten` : "Neuer Aussteller"} onClose={() => (modal = null)} size="lg">
        <ExhibitorForm initial={modal.item} onSave={handleSave} onCancel={() => (modal = null)}/>
    </Modal>
{:else if modal?.kind === "delete"}
    {@const item = modal.item}
    <ConfirmModal
        message={`"${item.name}" wirklich löschen? Verknüpfte Vortragseinträge und Standmarkierungen werden ebenfalls entfernt.`}
        onConfirm={() => {
            store.actions.exhibitors.remove(item.id);
            modal = null;
        }}
        onCancel={() => (modal = null)}
    />
{/if}
