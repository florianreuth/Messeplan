<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import type { LucideIcon } from "@lucide/svelte";
    import AlertCircle from "@lucide/svelte/icons/circle-exclamation-point";
    import CheckCircle from "@lucide/svelte/icons/circle-check";
    import type { SaveStatus } from "../../lib/types.ts";

    interface Indicator {
        text: string;
        color: string;
        icon?: LucideIcon;
    }

    const INDICATORS: Partial<Record<SaveStatus, Indicator>> = {
        saving: { text: "Wird gespeichert…", color: "text-amber-500" },
        saved: { text: "Gespeichert", color: "text-emerald-600", icon: CheckCircle },
        error: { text: "Speicherfehler", color: "text-red-600", icon: AlertCircle },
        session_expired: { text: "Sitzung abgelaufen", color: "text-red-600", icon: AlertCircle },
    };

    let { status }: { status: SaveStatus } = $props();
    const indicator = $derived(INDICATORS[status]);
</script>

{#if indicator}
    <span class="flex items-center gap-1 text-xs font-medium {indicator.color}" role="status">
        {#if status === "saving"}
            <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        {:else if indicator.icon}
            <indicator.icon class="h-3.5 w-3.5"/>
        {/if}
        {indicator.text}
    </span>
{/if}
