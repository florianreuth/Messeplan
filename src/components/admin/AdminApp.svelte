<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import type { LucideIcon } from "@lucide/svelte";
    import Building2 from "@lucide/svelte/icons/building-complex";
    import Globe from "@lucide/svelte/icons/globe";
    import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
    import LogOut from "@lucide/svelte/icons/log-out";
    import MapIcon from "@lucide/svelte/icons/map";
    import Menu from "@lucide/svelte/icons/menu";
    import Mic from "@lucide/svelte/icons/mic";
    import Settings from "@lucide/svelte/icons/settings";
    import Users from "@lucide/svelte/icons/users";
    import WifiOff from "@lucide/svelte/icons/wifi-off";
    import { untrack } from "svelte";
    import { ADMIN_PATHS, type AdminSection } from "../../lib/adminSections.ts";
    import { logout } from "../../lib/client/remote.ts";
    import { FairStore, setStore } from "../../lib/client/store.svelte.ts";
    import { DEFAULT_EVENT_NAME } from "../../lib/data/defaults.ts";
    import type { Snapshot } from "../../lib/types.ts";
    import ClassesAdmin from "./ClassesAdmin.svelte";
    import DashboardPage from "./DashboardPage.svelte";
    import ExhibitorsAdmin from "./ExhibitorsAdmin.svelte";
    import FloorPlanAdmin from "./floorplan/FloorPlanAdmin.svelte";
    import SaveBadge from "./SaveBadge.svelte";
    import SettingsAdmin from "./SettingsAdmin.svelte";
    import TalksAdmin from "./TalksAdmin.svelte";

    interface Props {
        section: AdminSection;
        snapshot: Snapshot;
    }

    const NAV_ITEMS: Array<{ section: AdminSection; label: string; icon: LucideIcon }> = [
        { section: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { section: "exhibitors", label: "Aussteller", icon: Building2 },
        { section: "talks", label: "Vorträge", icon: Mic },
        { section: "classes", label: "Klassen", icon: Users },
        { section: "floorplan", label: "Lageplan", icon: MapIcon },
        { section: "settings", label: "Einstellungen", icon: Settings },
    ];

    let { section, snapshot }: Props = $props();
    // The store owns the data after creation, the snapshot prop never changes
    const store = new FairStore(untrack(() => snapshot));
    setStore(store);
    $effect(() => store.connect());

    let sidebarOpen = $state(false);
    let sessionHintHidden = $state(false);

    const eventName = $derived(store.data.event.name || DEFAULT_EVENT_NAME);
    const sessionExpired = $derived(store.saveStatus === "session_expired" && !sessionHintHidden);

    async function handleLogout() {
        await store.flush();
        await logout();
        location.href = "/admin/login";
    }

    // Sends pending writes first, so moving between admin pages never triggers the unsaved-changes prompt
    async function navigate(event: MouseEvent & { currentTarget: HTMLAnchorElement }) {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }
        event.preventDefault();
        const { href } = event.currentTarget;
        await store.flush();
        location.href = href;
    }
</script>

<div class="flex min-h-screen bg-slate-50">
    <aside
        class="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-navy-950 text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
    >
        <div class="border-b border-navy-800 p-5">
            <p class="font-display text-lg leading-tight text-white">{eventName}</p>
            <p class="mt-0.5 text-xs text-navy-400">Verwaltung</p>
        </div>

        <nav class="flex-1 space-y-0.5 p-3">
            {#each NAV_ITEMS as item (item.section)}
                {@const active = item.section === section}
                <a
                    href={ADMIN_PATHS[item.section]}
                    onclick={navigate}
                    aria-current={active ? "page" : undefined}
                    class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all {active ? 'bg-navy-700 text-white' : 'text-navy-300 hover:bg-navy-800 hover:text-white'}"
                >
                    <item.icon class="h-4 w-4 shrink-0"/>
                    {item.label}
                </a>
            {/each}
        </nav>

        <div class="space-y-1 border-t border-navy-800 p-3">
            <a
                href="/"
                onclick={navigate}
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-300 transition-all hover:bg-navy-800 hover:text-white"
            >
                <Globe class="h-4 w-4 shrink-0"/>
                Zur Webseite
            </a>
            <button
                onclick={handleLogout}
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-300 transition-all hover:bg-navy-800 hover:text-white"
            >
                <LogOut class="h-4 w-4 shrink-0"/>
                Abmelden
            </button>
        </div>
    </aside>

    {#if sidebarOpen}
        <button
            class="fixed inset-0 z-30 bg-black/50 lg:hidden"
            aria-label="Menü schließen"
            onclick={() => (sidebarOpen = false)}
        ></button>
    {/if}

    <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <button
                class="rounded-lg p-2 transition-colors hover:bg-slate-100 lg:hidden"
                aria-label="Menü"
                aria-expanded={sidebarOpen}
                onclick={() => (sidebarOpen = !sidebarOpen)}
            >
                <Menu class="h-5 w-5"/>
            </button>
            <span class="flex-1 text-sm text-slate-400">Admin-Bereich</span>
            <SaveBadge status={store.saveStatus}/>
        </header>

        {#if store.offline}
            <div class="flex items-center gap-2 border-b border-orange-200 bg-orange-50 px-4 py-3">
                <WifiOff class="h-4 w-4 shrink-0 text-orange-600"/>
                <p class="text-sm font-medium text-orange-700">
                    Server nicht erreichbar – Änderungen werden nicht gespeichert.
                </p>
            </div>
        {/if}

        {#if store.error}
            <div class="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-3" role="alert">
                <p class="text-sm text-red-700">{store.error}</p>
                <button class="ml-4 text-sm text-slate-500" aria-label="Hinweis schließen" onclick={() => store.dismissError()}>
                    ×
                </button>
            </div>
        {/if}

        {#if sessionExpired}
            <div class="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-3" role="alert">
                <p class="text-sm text-red-700">
                    Deine Admin-Sitzung ist abgelaufen. Letzte Änderungen wurden möglicherweise nicht gespeichert.
                </p>
                <div class="ml-4 flex gap-2">
                    <a
                        class="text-sm font-medium text-red-700 underline"
                        href="/admin/login?next={encodeURIComponent(ADMIN_PATHS[section])}"
                    >
                        Neu anmelden
                    </a>
                    <button class="text-sm text-slate-500" aria-label="Hinweis schließen" onclick={() => (sessionHintHidden = true)}>
                        ×
                    </button>
                </div>
            </div>
        {/if}

        <main class="flex-1 overflow-auto p-4 sm:p-6">
            {#if section === "dashboard"}
                <DashboardPage/>
            {:else if section === "exhibitors"}
                <ExhibitorsAdmin/>
            {:else if section === "talks"}
                <TalksAdmin/>
            {:else if section === "classes"}
                <ClassesAdmin/>
            {:else if section === "floorplan"}
                <FloorPlanAdmin/>
            {:else}
                <SettingsAdmin/>
            {/if}
        </main>
    </div>
</div>
