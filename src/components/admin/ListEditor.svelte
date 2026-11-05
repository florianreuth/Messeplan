<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" generics="T extends Identifiable, F extends object">
    import Pencil from "@lucide/svelte/icons/pencil";
    import Trash2 from "@lucide/svelte/icons/trash";
    import type { Snippet } from "svelte";
    import type { Id, Identifiable } from "../../lib/types.ts";
    import ConfirmModal from "../ui/ConfirmModal.svelte";
    import Modal from "../ui/Modal.svelte";

    interface Props {
        title: string;
        addTitle: string;
        editTitle: string;
        items: T[];
        emptyValues: F;
        toValues: (item: T) => F;
        /** Returns why the values cannot be saved, or null. */
        validate: (values: F) => string | null;
        /** Returns an error message to keep the dialog open. */
        onSave: (values: F, editingId: Id | null) => string | void;
        onDelete: (item: T) => void;
        /** Returns why the item cannot be deleted, or null. */
        deleteBlocker?: (item: T) => string | null;
        confirmMessage: (item: T) => string;
        row: Snippet<[T]>;
        fields: Snippet<[F, boolean]>;
        rowClass?: string;
    }

    let {
        title, addTitle, editTitle, items, emptyValues, toValues, validate, onSave, onDelete, deleteBlocker,
        confirmMessage, row, fields, rowClass = "space-y-2",
    }: Props = $props();

    let editingId = $state<Id | null>(null);
    let creating = $state(false);
    let values = $state({} as F);
    let deleting = $state<T | null>(null);
    let formError = $state("");
    let listError = $state("");

    const open = $derived(!!editingId || creating);

    function startCreate() {
        values = { ...emptyValues };
        formError = "";
        creating = true;
    }

    function startEdit(item: T) {
        values = toValues(item);
        formError = "";
        editingId = item.id;
    }

    function closeForm() {
        creating = false;
        editingId = null;
    }

    function requestDelete(item: T) {
        listError = deleteBlocker?.(item) ?? "";
        if (!listError) {
            deleting = item;
        }
    }

    function submit() {
        const snapshot = $state.snapshot(values) as F;
        const error = validate(snapshot) ?? onSave(snapshot, editingId);
        if (error) {
            formError = error;
            return;
        }
        closeForm();
    }
</script>

<div>
    <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700">{title}</h3>
        <button class="btn-secondary text-xs" onclick={startCreate}>+ Hinzufügen</button>
    </div>

    {#if listError}
        <p class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{listError}</p>
    {/if}

    <div class={rowClass}>
        {#each items as item (item.id)}
            <div class="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
                {@render row(item)}
                <button class="btn-ghost text-xs" aria-label="Bearbeiten" onclick={() => startEdit(item)}>
                    <Pencil class="h-3.5 w-3.5"/>
                </button>
                <button class="btn-ghost text-xs text-red-500" aria-label="Löschen" onclick={() => requestDelete(item)}>
                    <Trash2 class="h-3.5 w-3.5"/>
                </button>
            </div>
        {/each}
    </div>

    {#if open}
        <Modal title={creating ? addTitle : editTitle} onClose={closeForm} size="sm">
            <div class="space-y-4">
                {@render fields(values, creating)}
                {#if formError}
                    <p class="text-sm text-red-600" role="alert">{formError}</p>
                {/if}
                <div class="flex justify-end gap-2 border-t pt-2">
                    <button class="btn-secondary" onclick={closeForm}>Abbrechen</button>
                    <button class="btn-primary" onclick={submit}>Speichern</button>
                </div>
            </div>
        </Modal>
    {/if}

    {#if deleting}
        {@const item = deleting}
        <ConfirmModal
            message={confirmMessage(item)}
            onConfirm={() => {
                onDelete(item);
                deleting = null;
            }}
            onCancel={() => (deleting = null)}
        />
    {/if}
</div>
