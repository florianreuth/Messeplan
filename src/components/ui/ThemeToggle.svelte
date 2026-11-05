<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Moon from "@lucide/svelte/icons/moon";
    import Sun from "@lucide/svelte/icons/sun";
    import { toggleTheme } from "../../lib/client/theme.ts";

    let { class: className = "" }: { class?: string } = $props();
</script>

<!-- Icon and label follow the .dark class via CSS, so the server-rendered button is right before hydration -->
<button
    onclick={toggleTheme}
    class="flex h-10 w-10 items-center justify-center rounded-full text-navy-100 transition-colors hover:bg-white/10 hover:text-white dark:text-neutral-300 {className}"
>
    <Moon class="h-4 w-4 dark:hidden"/>
    <Sun class="hidden h-4 w-4 dark:block"/>
    <span class="sr-only dark:hidden">Dunkles Design</span>
    <span class="sr-only hidden dark:inline">Helles Design</span>
</button>
