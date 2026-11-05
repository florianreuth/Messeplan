<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Trash2 from "@lucide/svelte/icons/trash";
    import X from "@lucide/svelte/icons/x";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        onClose: () => void;
        deleteLabel: string;
        onDelete: () => void;
        children: Snippet;
    }

    let { title, onClose, deleteLabel, onDelete, children }: Props = $props();
</script>

<div class="card space-y-3 p-4">
    <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700">{title}</h3>
        <button onclick={onClose} aria-label="Auswahl aufheben" class="text-slate-400 hover:text-slate-600">
            <X class="h-4 w-4"/>
        </button>
    </div>

    {@render children()}

    <button
        onclick={onDelete}
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
    >
        <Trash2 class="h-3.5 w-3.5"/> {deleteLabel}
    </button>
</div>
