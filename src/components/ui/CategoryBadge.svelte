<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { tintStyle } from "../../lib/colors.ts";
    import type { Id } from "../../lib/types.ts";

    interface Props {
        categoryId?: Id;
        size?: "xs" | "sm";
    }

    let { categoryId, size = "sm" }: Props = $props();
    const store = getStore();
    const category = $derived(store.data.categories.find((item) => item.id === categoryId));
</script>

{#if category}
    <span
        class="tint inline-flex items-center rounded-full border text-xs font-medium {size === 'xs' ? 'px-1.5 py-0.5' : 'px-2.5 py-1'}"
        style={tintStyle(category.color)}
    >
        {category.label}
    </span>
{/if}
