<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        subtitle: string;
        action?: Snippet;
    }

    let { title, subtitle, action }: Props = $props();
</script>

<div class="flex items-center justify-between">
    <div>
        <h1 class="font-display text-2xl text-navy-900">{title}</h1>
        <p class="text-sm text-slate-500">{subtitle}</p>
    </div>
    {@render action?.()}
</div>
