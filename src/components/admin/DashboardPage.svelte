<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import type { LucideIcon } from "@lucide/svelte";
    import Building2 from "@lucide/svelte/icons/building-complex";
    import Download from "@lucide/svelte/icons/download";
    import Lightbulb from "@lucide/svelte/icons/lightbulb";
    import MapIcon from "@lucide/svelte/icons/map";
    import MapPin from "@lucide/svelte/icons/map-pin";
    import Mic from "@lucide/svelte/icons/mic";
    import Settings from "@lucide/svelte/icons/settings";
    import TriangleAlert from "@lucide/svelte/icons/triangle-exclamation-point";
    import Upload from "@lucide/svelte/icons/upload";
    import Users from "@lucide/svelte/icons/users";
    import { ADMIN_PATHS } from "../../lib/adminSections.ts";
    import { BACKUP_URL } from "../../lib/client/remote.ts";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import ConfirmModal from "../ui/ConfirmModal.svelte";

    interface QuickLink {
        icon: LucideIcon;
        label: string;
        href: string;
        description: string;
    }

    const QUICK_LINKS: QuickLink[] = [
        { icon: Building2, label: "Aussteller hinzufügen", href: ADMIN_PATHS.exhibitors, description: "Firmen, Hochschulen und Behörden verwalten" },
        { icon: Mic, label: "Vortrag eintragen", href: ADMIN_PATHS.talks, description: "Vorträge, Seminare und Workshops planen" },
        { icon: Users, label: "Klassen anlegen", href: ADMIN_PATHS.classes, description: "Schulklassen und deren Zeitpläne verwalten" },
        { icon: MapIcon, label: "Lageplan bearbeiten", href: ADMIN_PATHS.floorplan, description: "Standpositionen auf dem Grundriss platzieren" },
        { icon: Settings, label: "Einstellungen", href: ADMIN_PATHS.settings, description: "Veranstaltungsname, Datum, Kategorien" },
    ];

    const store = getStore();

    let importInput: HTMLInputElement | undefined = $state();
    let pendingFile = $state<File | null>(null);
    let importing = $state(false);
    let importResult = $state<{ ok: boolean; message: string } | null>(null);

    const placedBooths = $derived(store.data.floorPlan.floors.reduce((total, floor) => total + floor.booths.length, 0));
    const stats = $derived([
        { icon: Building2, value: store.data.exhibitors.length, label: "Aussteller", href: ADMIN_PATHS.exhibitors },
        { icon: Mic, value: store.data.talks.length, label: "Vorträge/Workshops", href: ADMIN_PATHS.talks },
        { icon: Users, value: store.data.classes.length, label: "Klassen", href: ADMIN_PATHS.classes },
        { icon: MapPin, value: placedBooths, label: "Platzierte Stände", href: ADMIN_PATHS.floorplan },
    ]);

    function chooseFile(event: Event & { currentTarget: HTMLInputElement }) {
        pendingFile = event.currentTarget.files?.[0] ?? null;
        event.currentTarget.value = "";
    }

    async function runImport() {
        const file = pendingFile;
        pendingFile = null;
        if (!file) {
            return;
        }
        importing = true;
        try {
            await store.importBackup(file);
            importResult = { ok: true, message: "Daten erfolgreich importiert!" };
        } catch (cause) {
            importResult = { ok: false, message: `Fehler beim Import: ${cause instanceof Error ? cause.message : "Unbekannter Fehler"}` };
        } finally {
            importing = false;
        }
    }
</script>

<div class="animate-fade-in space-y-6">
    <div>
        <h1 class="font-display text-2xl text-navy-900">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-500">Übersicht der Messe-Verwaltung</p>
    </div>

    {#if !store.data.event.date}
        <div class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Lightbulb class="h-5 w-5 shrink-0 text-amber-600"/>
            <div>
                <p class="text-sm font-medium text-amber-800">Erste Schritte</p>
                <p class="mt-0.5 text-sm text-amber-700">
                    Richte zunächst die <a href={ADMIN_PATHS.settings} class="underline">Grundeinstellungen</a> ein (Name, Datum, Logo).
                </p>
            </div>
        </div>
    {/if}

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {#each stats as stat (stat.label)}
            <a href={stat.href} class="block">
                <div class="card group p-5 transition-all hover:shadow-md">
                    <div class="mb-2 text-slate-400"><stat.icon class="h-7 w-7"/></div>
                    <div class="mb-0.5 font-display text-3xl text-navy-900">{stat.value}</div>
                    <div class="text-sm text-slate-500">{stat.label}</div>
                </div>
            </a>
        {/each}
    </div>

    <div>
        <h2 class="mb-3 font-semibold text-slate-700">Schnellzugriff</h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each QUICK_LINKS as link (link.href)}
                <a href={link.href} class="card group flex items-start gap-3 p-4 transition-all hover:shadow-md">
                    <link.icon class="mt-0.5 h-5 w-5 shrink-0 text-slate-400"/>
                    <div>
                        <p class="text-sm font-medium text-slate-800 transition-colors group-hover:text-navy-700">{link.label}</p>
                        <p class="mt-0.5 text-xs text-slate-400">{link.description}</p>
                    </div>
                </a>
            {/each}
        </div>
    </div>

    <div class="card p-5">
        <h2 class="mb-1 font-semibold text-slate-700">Daten-Backup</h2>
        <p class="mb-4 text-sm text-slate-500">
            Alle Daten als JSON exportieren oder aus einer Sicherungsdatei importieren.
            Nützlich zum Übertragen auf einen anderen Computer oder als Backup.
        </p>
        <div class="flex flex-wrap gap-3">
            <a href={BACKUP_URL} download class="btn-primary">
                <Download class="h-4 w-4"/> Exportieren (JSON)
            </a>
            <button onclick={() => importInput?.click()} class="btn-secondary" disabled={importing}>
                <Upload class="h-4 w-4"/> {importing ? "Wird importiert…" : "Importieren"}
            </button>
            <input
                bind:this={importInput}
                type="file"
                accept=".json,application/json"
                class="hidden"
                aria-label="Sicherungsdatei wählen"
                onchange={chooseFile}
            />
        </div>
        {#if importResult}
            <p class="mt-3 text-sm {importResult.ok ? 'text-emerald-600' : 'text-red-600'}" role="status">{importResult.message}</p>
        {/if}
        <p class="mt-3 flex items-center gap-1 text-xs text-slate-400">
            <TriangleAlert class="h-3.5 w-3.5 shrink-0"/>
            Beim Import werden alle aktuellen Daten überschrieben.
        </p>
    </div>
</div>

{#if pendingFile}
    <ConfirmModal
        message="Beim Import werden alle aktuellen Daten überschrieben."
        confirmLabel="Importieren"
        onConfirm={runImport}
        onCancel={() => (pendingFile = null)}
    />
{/if}
