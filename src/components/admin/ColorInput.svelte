<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    let { value = $bindable(), id }: { value: string; id: string } = $props();
</script>

<div class="flex items-center gap-2">
    <input type="color" bind:value class="h-10 w-10 cursor-pointer rounded-sm border border-slate-200" aria-label="Farbe wählen"/>
    <input {id} type="text" bind:value class="input w-32 font-mono text-sm" placeholder="#3B82F6"/>
</div>
