<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Modal from "./Modal.svelte";

    interface Props {
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
        confirmLabel?: string;
    }

    let { message, onConfirm, onCancel, confirmLabel = "Löschen" }: Props = $props();
</script>

<Modal title="Bestätigung" onClose={onCancel} size="sm">
    <p class="mb-6 text-slate-600">{message}</p>
    <div class="flex justify-end gap-2">
        <button class="btn-secondary" onclick={onCancel}>Abbrechen</button>
        <button class="btn-danger" onclick={onConfirm}>{confirmLabel}</button>
    </div>
</Modal>
