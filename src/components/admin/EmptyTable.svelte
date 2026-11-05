<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import type { LucideIcon } from "@lucide/svelte";

    let { icon: Icon, message }: { icon: LucideIcon; message: string } = $props();
</script>

<div class="card p-12 text-center">
    <Icon class="mx-auto mb-3 h-10 w-10 text-slate-300"/>
    <p class="text-slate-500">{message}</p>
</div>
