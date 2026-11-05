<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { STROKE_WIDTHS } from "./editorState.ts";

    interface Props {
        value: number;
        onChange: (width: number) => void;
        variant?: "block" | "inline";
    }

    let { value, onChange, variant = "block" }: Props = $props();
</script>

<div class={variant === "block" ? "flex gap-2" : "flex gap-1"}>
    {#each STROKE_WIDTHS as width (width)}
        {@const active = value === width}
        <button
            onclick={() => onChange(width)}
            aria-pressed={active}
            class={variant === "block"
                ? `flex-1 rounded-lg border py-1.5 text-xs font-medium transition-all ${active ? "border-navy-900 bg-navy-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"}`
                : `rounded-sm border px-2 py-0.5 text-xs transition-all ${active ? "border-navy-900 bg-navy-900 text-white" : "border-slate-200 text-slate-600"}`}
        >
            {variant === "block" ? `${width}px` : width}
        </button>
    {/each}
</div>
