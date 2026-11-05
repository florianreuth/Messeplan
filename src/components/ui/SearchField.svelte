<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Search from "@lucide/svelte/icons/search";
    import X from "@lucide/svelte/icons/x";

    interface Props {
        value: string;
        placeholder: string;
    }

    let { value = $bindable(), placeholder }: Props = $props();
</script>

<div class="relative">
    <Search class="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"/>
    <input
        type="search"
        inputmode="search"
        aria-label={placeholder}
        {placeholder}
        bind:value
        class="input h-12 pr-10 pl-10"
    />
    {#if value}
        <button
            onclick={() => (value = "")}
            aria-label="Suche leeren"
            class="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
        >
            <X class="h-4 w-4"/>
        </button>
    {/if}
</div>
