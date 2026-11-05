<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { ARROW_COLORS } from "./editorState.ts";

    interface Props {
        value: string;
        onChange: (color: string) => void;
        size?: "sm" | "md";
    }

    let { value, onChange, size = "md" }: Props = $props();
    const swatch = $derived(size === "sm" ? "h-5 w-5" : "h-6 w-6");
</script>

<div class="flex flex-wrap gap-1.5">
    {#each ARROW_COLORS as color (color)}
        <button
            title={color}
            aria-label={color}
            aria-pressed={value === color}
            onclick={() => onChange(color)}
            class="{swatch} rounded-full border-2 transition-transform hover:scale-110"
            style="background-color: {color}; border-color: {value === color ? 'white' : 'transparent'}; outline: {value === color ? `2px solid ${color}` : 'none'}"
        ></button>
    {/each}
    <input
        type="color"
        {value}
        oninput={(event) => onChange(event.currentTarget.value)}
        class="{swatch} cursor-pointer rounded-full border border-slate-300"
        title="Eigene Farbe"
        aria-label="Eigene Farbe"
    />
</div>
