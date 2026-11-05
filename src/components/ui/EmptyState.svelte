<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import type { LucideIcon } from "@lucide/svelte";
    import type { Snippet } from "svelte";

    interface Props {
        icon: LucideIcon;
        /** Icon size class, larger for whole-page states. */
        iconSize?: string;
        title: string;
        description?: string;
        action?: Snippet;
    }

    let { icon: Icon, iconSize = "h-12 w-12", title, description, action }: Props = $props();
</script>

<div class="card flex flex-col items-center justify-center px-6 py-14 text-center">
    <div class="mb-4 text-slate-300 dark:text-neutral-600"><Icon class={iconSize}/></div>
    <h3 class="mb-2 font-display text-xl text-navy-900 dark:text-white">{title}</h3>
    {#if description}
        <p class="mb-6 max-w-sm text-sm text-slate-500 dark:text-neutral-400">{description}</p>
    {/if}
    {@render action?.()}
</div>
