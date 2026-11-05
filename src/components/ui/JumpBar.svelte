<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    export interface JumpTarget {
        id: string;
        label: string;
    }
</script>

<script lang="ts">
    interface Props {
        label: string;
        targets: JumpTarget[];
    }

    let { label, targets }: Props = $props();

    function scrollToSection(event: MouseEvent, id: string) {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
</script>

{#if targets.length >= 2}
    <div class="-mx-4 flex scrollbar-hide items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <span class="shrink-0 text-xs text-slate-400 dark:text-neutral-400">{label}</span>
        {#each targets as target (target.id)}
            <a
                href="#{target.id}"
                onclick={(event) => scrollToSection(event, target.id)}
                class="tnum shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-navy-300 active:scale-95 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-500"
            >
                {target.label}
            </a>
        {/each}
    </div>
{/if}
