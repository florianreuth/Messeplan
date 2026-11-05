<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import type { LucideIcon } from "@lucide/svelte";
    import Building2 from "@lucide/svelte/icons/building-complex";
    import CalendarDays from "@lucide/svelte/icons/calendar-days";
    import Mic from "@lucide/svelte/icons/mic";

    export type PublicPage = "exhibitors" | "talks" | "classes";

    const NAV_ITEMS: Array<{ page: PublicPage; href: string; label: string; icon: LucideIcon }> = [
        { page: "exhibitors", href: "/", label: "Aussteller", icon: Building2 },
        { page: "talks", href: "/vortraege", label: "Vorträge", icon: Mic },
        { page: "classes", href: "/klassen", label: "Klassenplan", icon: CalendarDays },
    ];
</script>

<script lang="ts">
    import Settings from "@lucide/svelte/icons/settings";
    import { FairStore, setStore } from "../../lib/client/store.svelte.ts";
    import { DEFAULT_EVENT_NAME } from "../../lib/data/defaults.ts";
    import type { Snapshot } from "../../lib/types.ts";
    import ThemeToggle from "../ui/ThemeToggle.svelte";
    import ClassSchedulePage from "./ClassSchedulePage.svelte";
    import ExhibitionPage from "./ExhibitionPage.svelte";
    import TalksPage from "./TalksPage.svelte";

    interface Props {
        page: PublicPage;
        snapshot: Snapshot;
    }

    let { page, snapshot }: Props = $props();

    // The snapshot only seeds the store; later updates arrive through the live connection
    // svelte-ignore state_referenced_locally
    const store = setStore(new FairStore(snapshot));
    $effect(() => store.connect());

    const event = $derived(store.data.event);
    const eventName = $derived(event.name || DEFAULT_EVENT_NAME);
    const year = new Date().getFullYear();
</script>

<div class="flex min-h-screen flex-col">
    <header class="pt-safe sticky top-0 z-30 bg-navy-900/95 text-white shadow-lift backdrop-blur-md dark:border-b dark:border-white/10 dark:bg-neutral-900/95">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-3 py-2.5 sm:py-4">
                {#if event.logoUrl}
                    <img
                        src={event.logoUrl} alt={eventName} width="220" height="56"
                        class="h-9 w-auto max-w-[180px] object-contain object-left sm:h-14 sm:max-w-[220px]"
                    />
                {:else}
                    <h1 class="truncate font-display text-xl leading-tight sm:text-3xl">{eventName}</h1>
                {/if}
                {#if event.date}
                    <span class="hidden border-l border-white/20 pl-4 text-sm text-navy-200 sm:block dark:text-neutral-400">
                        {event.date}
                    </span>
                {/if}

                <span class="text-[11px] whitespace-nowrap text-white sm:text-xs">© {year} Florian Reuth</span>

                <nav class="ml-auto hidden items-center gap-1 sm:flex">
                    {#each NAV_ITEMS as item (item.page)}
                        <a
                            href={item.href}
                            aria-current={item.page === page ? "page" : undefined}
                            class="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all {item.page === page
                                ? 'bg-white text-navy-900 shadow-card dark:bg-neutral-100 dark:text-neutral-900'
                                : 'text-navy-100 hover:bg-white/10 hover:text-white dark:text-neutral-300'}"
                        >
                            <item.icon class="h-4 w-4"/>
                            {item.label}
                        </a>
                    {/each}
                </nav>
                <ThemeToggle class="ml-auto sm:ml-1"/>

                <a
                    href="/admin"
                    aria-label="Admin-Bereich"
                    class="hidden h-10 w-10 items-center justify-center rounded-full text-navy-200 transition-colors hover:bg-white/10 hover:text-white sm:flex dark:text-neutral-400"
                >
                    <Settings class="h-4 w-4"/>
                </a>
            </div>
        </div>
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        {#if page === "exhibitors"}
            <ExhibitionPage/>
        {:else if page === "talks"}
            <TalksPage/>
        {:else}
            <ClassSchedulePage/>
        {/if}
    </main>

    <footer class="pb-navbar mt-8 border-t border-slate-200 py-5 text-center text-xs text-slate-400 sm:pb-5 dark:border-white/10 dark:text-neutral-400">
        <p>{eventName} {event.date ? `· ${event.date}` : ""} · © Florian Reuth</p>
        <div class="mt-1.5 flex items-center justify-center gap-3">
            {#if event.imprintUrl}
                <a
                    href={event.imprintUrl} target="_blank" rel="noopener noreferrer"
                    class="underline decoration-slate-300 transition-colors hover:text-slate-600 dark:decoration-neutral-600 dark:hover:text-slate-300"
                >
                    Impressum &amp; Datenschutz
                </a>
            {/if}
            <a
                href="/admin"
                class="underline decoration-slate-300 transition-colors hover:text-slate-600 sm:hidden dark:decoration-neutral-600 dark:hover:text-slate-300"
            >
                Admin
            </a>
        </div>
    </footer>

    <nav class="pb-safe fixed right-0 bottom-0 left-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md sm:hidden dark:border-white/10 dark:bg-neutral-900/95">
        <div class="grid grid-cols-3">
            {#each NAV_ITEMS as item (item.page)}
                {@const active = item.page === page}
                <a
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    class="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors {active
                        ? 'text-navy-900 dark:text-white'
                        : 'text-slate-400 dark:text-neutral-500'}"
                >
                    <span class="flex h-8 w-14 items-center justify-center rounded-full transition-colors {active ? 'bg-navy-100 dark:bg-white/10' : ''}">
                        <item.icon class="h-5 w-5"/>
                    </span>
                    {item.label}
                </a>
            {/each}
        </div>
    </nav>
</div>
