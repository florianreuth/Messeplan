<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import type { LucideIcon } from "@lucide/svelte";

    export interface FilterChip {
        value: string;
        label: string;
        count?: number;
        icon?: LucideIcon;
        /** Data color; the chip is tinted when idle and filled when active. */
        color?: string;
    }
</script>

<script lang="ts">
    import { tintStyle } from "../../lib/colors.ts";

    interface Props {
        chips: FilterChip[];
        value: string;
        allLabel: string;
    }

    let { chips, value = $bindable(), allLabel }: Props = $props();
</script>

<div class="-mx-4 flex scrollbar-hide gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
    <button onclick={() => (value = "")} class="chip {value ? 'chip-idle' : 'chip-active'}" aria-pressed={!value}>
        {allLabel}
    </button>
    {#each chips as chip (chip.value)}
        {@const active = value === chip.value}
        <button
            onclick={() => (value = active ? "" : chip.value)}
            aria-pressed={active}
            class={chip.color ? (active ? "chip" : "chip tint") : `chip ${active ? "chip-active" : "chip-idle"}`}
            style={chip.color
                ? (active ? `background-color: ${chip.color}; border-color: ${chip.color}; color: #fff` : tintStyle(chip.color))
                : undefined}
        >
            {#if chip.icon}
                <chip.icon class="h-3.5 w-3.5"/>
            {/if}
            {chip.label}
            {#if chip.count !== undefined}
                <span class="tnum opacity-70">{chip.count}</span>
            {/if}
        </button>
    {/each}
</div>
