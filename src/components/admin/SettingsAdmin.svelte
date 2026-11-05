<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import ImageIcon from "@lucide/svelte/icons/image";
    import { untrack } from "svelte";
    import { errorMessage, uploadImage } from "../../lib/client/remote.ts";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { byTimeSlotOrder } from "../../lib/data/collections.ts";
    import { type FieldErrors, fieldErrors, firstError } from "../../lib/formErrors.ts";
    import { categorySchema, eventSchema, groupSchema, timeSlotSchema, trackSchema } from "../../lib/schemas.ts";
    import type { Category, Group, TimeSlot, Track } from "../../lib/types.ts";
    import ColorInput from "./ColorInput.svelte";
    import ListEditor from "./ListEditor.svelte";

    interface ColoredValues {
        label: string;
        color: string;
    }

    interface GroupValues extends ColoredValues {
        id: string;
    }

    interface TrackValues {
        id: string;
        label: string;
        firstYear: string;
        lastYear: string;
        sections: boolean;
    }

    interface TimeSlotValues {
        start: string;
        end: string;
        label: string;
    }

    const MAX_EVENT_LOGO_BYTES = 2 * 1024 * 1024;
    const SAVED_HINT_MS = 2000;
    const REQUIRED_TEXTS = {
        id: "ID ist erforderlich",
        label: "Bezeichnung ist erforderlich",
        start: "Von ist erforderlich",
        end: "Bis ist erforderlich",
    };
    const YEAR_RULE = "Jahrgänge liegen zwischen 1 und 13, der letzte nicht vor dem ersten.";
    const YEAR_TEXTS = { firstYear: YEAR_RULE, lastYear: YEAR_RULE };
    // The ids of categories and time slots are generated on save
    const CATEGORY_FIELDS = categorySchema.omit({ id: true });
    const TIME_SLOT_FIELDS = timeSlotSchema.omit({ id: true });

    const store = getStore();
    const uid = $props.id();

    // Edited as a draft and only written on "Speichern", like the original form
    let event = $state(untrack(() => ({
        name: store.data.event.name,
        date: store.data.event.date ?? "",
        description: store.data.event.description ?? "",
        logoUrl: store.data.event.logoUrl ?? "",
        imprintUrl: store.data.event.imprintUrl ?? "",
    })));
    let eventErrors = $state<FieldErrors>({});
    let saved = $state(false);
    let logoError = $state("");
    let uploading = $state(false);

    const timeSlots = $derived([...store.data.timeSlots].sort(byTimeSlotOrder));

    function handleEventSave() {
        eventErrors = fieldErrors(eventSchema, event, {
            required: { name: "Name ist erforderlich" },
            invalid: { imprintUrl: "Bitte eine vollständige Adresse mit https:// angeben" },
        });
        if (Object.keys(eventErrors).length > 0) {
            return;
        }
        store.actions.updateEvent({
            name: event.name.trim(),
            date: event.date.trim() || undefined,
            description: event.description.trim() || undefined,
            logoUrl: event.logoUrl || undefined,
            imprintUrl: event.imprintUrl.trim() || undefined,
        });
        saved = true;
        setTimeout(() => (saved = false), SAVED_HINT_MS);
    }

    async function handleLogo(change: Event & { currentTarget: HTMLInputElement }) {
        const file = change.currentTarget.files?.[0];
        change.currentTarget.value = "";
        if (!file) {
            return;
        }
        logoError = "";
        uploading = true;
        try {
            event.logoUrl = await uploadImage(file, MAX_EVENT_LOGO_BYTES);
        } catch (cause) {
            logoError = errorMessage(cause);
        } finally {
            uploading = false;
        }
    }

    function groupInUse(group: Group): string | null {
        const count = store.data.exhibitors.filter((exhibitor) => exhibitor.groupId === group.id).length;
        return count > 0 ? `Dem Bereich sind noch ${count} Aussteller zugeordnet.` : null;
    }

    function trackInUse(track: Track): string | null {
        const count = store.data.classes.filter((schoolClass) => schoolClass.track === track.id).length;
        return count > 0 ? `Dem Zweig sind noch ${count} Klassen zugeordnet.` : null;
    }

    function toTrack(values: TrackValues): Track {
        return {
            id: values.id.trim(),
            label: values.label,
            firstYear: parseInt(values.firstYear, 10),
            lastYear: parseInt(values.lastYear, 10),
            sections: values.sections,
        };
    }
</script>

{#snippet colorRow(item: Category | Group, badge: boolean)}
    {#if badge}
        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-bold text-white" style:background-color={item.color}>
            {item.id}
        </div>
    {:else}
        <div class="h-4 w-4 shrink-0 rounded-full" style:background-color={item.color}></div>
    {/if}
    <span class="flex-1 text-sm">{item.label}</span>
{/snippet}

{#snippet categoryRow(category: Category)}
    {@render colorRow(category, false)}
{/snippet}

{#snippet groupRow(group: Group)}
    {@render colorRow(group, true)}
{/snippet}

{#snippet categoryFields(values: ColoredValues)}
    <div>
        <label class="label" for="{uid}-category-label">Bezeichnung</label>
        <input id="{uid}-category-label" type="text" bind:value={values.label} class="input" placeholder="z.B. Unternehmen"/>
    </div>
    <div>
        <label class="label" for="{uid}-category-color">Farbe</label>
        <ColorInput id="{uid}-category-color" bind:value={values.color}/>
    </div>
{/snippet}

{#snippet groupFields(values: GroupValues, isNew: boolean)}
    <div>
        <label class="label" for="{uid}-group-id">ID (Buchstabe)</label>
        <input
            id="{uid}-group-id"
            type="text"
            maxlength="3"
            value={values.id}
            oninput={(input) => (values.id = input.currentTarget.value.toUpperCase())}
            class="input font-mono"
            placeholder="z.B. A"
            disabled={!isNew}
        />
    </div>
    <div>
        <label class="label" for="{uid}-group-label">Bezeichnung</label>
        <input id="{uid}-group-label" type="text" bind:value={values.label} class="input" placeholder="z.B. Bereich A"/>
    </div>
    <div>
        <label class="label" for="{uid}-group-color">Farbe</label>
        <ColorInput id="{uid}-group-color" bind:value={values.color}/>
    </div>
{/snippet}

{#snippet trackRow(track: Track)}
    <div class="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-sm bg-navy-900 px-1.5 font-mono text-xs font-bold text-white">
        {track.id}
    </div>
    <span class="flex-1 text-sm">{track.label}</span>
    <span class="hidden text-xs text-slate-400 sm:inline">
        Jahrgang {track.firstYear}–{track.lastYear}{track.sections ? " · Klassen a, b, c …" : ""}
    </span>
{/snippet}

{#snippet trackFields(values: TrackValues, isNew: boolean)}
    <div class="grid grid-cols-3 gap-3">
        <div>
            <label class="label" for="{uid}-track-id">Kürzel</label>
            <input
                id="{uid}-track-id"
                type="text"
                maxlength="4"
                value={values.id}
                oninput={(input) => (values.id = input.currentTarget.value.toUpperCase())}
                class="input font-mono"
                placeholder="z.B. G"
                disabled={!isNew}
            />
        </div>
        <div class="col-span-2">
            <label class="label" for="{uid}-track-label">Bezeichnung</label>
            <input id="{uid}-track-label" type="text" bind:value={values.label} class="input" placeholder="z.B. Gymnasialzweig"/>
        </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
        <div>
            <label class="label" for="{uid}-track-first">Erster Jahrgang</label>
            <input id="{uid}-track-first" type="number" min="1" max="13" bind:value={values.firstYear} class="input"/>
        </div>
        <div>
            <label class="label" for="{uid}-track-last">Letzter Jahrgang</label>
            <input id="{uid}-track-last" type="number" min="1" max="13" bind:value={values.lastYear} class="input"/>
        </div>
    </div>
    <label class="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" bind:checked={values.sections} class="mt-0.5"/>
        <span>
            Mehrere Klassen pro Jahrgang mit Buchstaben (5a, 5b …)
            <span class="block text-xs text-slate-400">Ohne Buchstaben gibt es eine Klasse je Jahrgang, z.B. in der Oberstufe.</span>
        </span>
    </label>
    {#if !isNew}
        <p class="text-xs text-slate-400">Das Kürzel ist Teil jeder Klassen-ID und kann nicht geändert werden.</p>
    {/if}
{/snippet}

{#snippet timeSlotRow(slot: TimeSlot)}
    <span class="w-28 font-mono text-sm text-slate-700">{slot.start} – {slot.end}</span>
    <span class="flex-1 text-sm text-slate-500">{slot.label || "—"}</span>
{/snippet}

{#snippet timeSlotFields(values: TimeSlotValues)}
    <div class="grid grid-cols-2 gap-3">
        <div>
            <label class="label" for="{uid}-slot-start">Von <span class="text-red-500">*</span></label>
            <input id="{uid}-slot-start" type="time" bind:value={values.start} class="input"/>
        </div>
        <div>
            <label class="label" for="{uid}-slot-end">Bis <span class="text-red-500">*</span></label>
            <input id="{uid}-slot-end" type="time" bind:value={values.end} class="input"/>
        </div>
    </div>
    <div>
        <label class="label" for="{uid}-slot-label">Bezeichnung (optional)</label>
        <input
            id="{uid}-slot-label"
            type="text"
            bind:value={values.label}
            class="input"
            placeholder={"z.B. \"Gemeinsamer Start\""}
        />
    </div>
{/snippet}

<div class="max-w-2xl animate-fade-in space-y-6">
    <div>
        <h1 class="font-display text-2xl text-navy-900">Einstellungen</h1>
        <p class="mt-1 text-sm text-slate-500">Veranstaltungsdetails, Kategorien, Bereiche, Zweige und Zeitslots konfigurieren</p>
    </div>

    <div class="card space-y-4 p-5">
        <h2 class="font-semibold text-slate-700">Veranstaltungsdetails</h2>

        <div>
            <label class="label" for="{uid}-name">Name der Veranstaltung <span class="text-red-500">*</span></label>
            <input
                id="{uid}-name"
                type="text"
                bind:value={event.name}
                class="input {eventErrors.name ? 'border-red-400' : ''}"
                placeholder="z.B. Berufsmesse 2026"
            />
            {#if eventErrors.name}<p class="mt-1 text-xs text-red-500">{eventErrors.name}</p>{/if}
        </div>

        <div>
            <span class="label">Logo</span>
            <p class="mb-3 text-xs text-slate-400">
                Wird als Hauptlogo im Header der öffentlichen Seite angezeigt. Am besten PNG mit transparentem
                Hintergrund (max. 2 MB).
            </p>
            {#if event.logoUrl}
                <div class="flex items-end gap-4">
                    <div class="relative shrink-0 rounded-2xl border border-slate-200 bg-slate-100 p-3">
                        <img src={event.logoUrl} alt="" class="h-20 max-w-[240px] object-contain"/>
                        <button
                            onclick={() => (event.logoUrl = "")}
                            aria-label="Logo entfernen"
                            class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white shadow-md transition-colors hover:bg-red-600"
                        >
                            ×
                        </button>
                    </div>
                    <label class="btn-secondary mb-1 cursor-pointer text-xs">
                        {uploading ? "Wird hochgeladen…" : "Anderes Logo hochladen"}
                        <input type="file" accept="image/*" class="hidden" onchange={handleLogo} disabled={uploading}/>
                    </label>
                </div>
            {:else}
                <label
                    class="group flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 transition-all hover:border-navy-400 hover:bg-navy-50"
                >
                    <ImageIcon class="mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-navy-600"/>
                    <span class="text-sm font-medium text-slate-500 group-hover:text-navy-700">
                        {uploading ? "Wird hochgeladen…" : "Logo hochladen"}
                    </span>
                    <span class="mt-0.5 text-xs text-slate-400">PNG, JPG · max. 2 MB</span>
                    <input type="file" accept="image/*" class="hidden" onchange={handleLogo} disabled={uploading}/>
                </label>
            {/if}
            {#if logoError}<p class="mt-1 text-xs text-red-500">{logoError}</p>{/if}
        </div>

        <div>
            <label class="label" for="{uid}-date">Datum</label>
            <input id="{uid}-date" type="text" bind:value={event.date} class="input" placeholder="z.B. 15. Januar 2025"/>
        </div>

        <div>
            <label class="label" for="{uid}-description">Kurzbeschreibung (optional)</label>
            <textarea
                id="{uid}-description"
                bind:value={event.description}
                class="input resize-none"
                rows="2"
                placeholder="Willkommenstext für die Startseite…"
            ></textarea>
        </div>

        <div>
            <label class="label" for="{uid}-imprint">Impressum-Link (optional)</label>
            <input
                id="{uid}-imprint"
                type="url"
                bind:value={event.imprintUrl}
                class="input {eventErrors.imprintUrl ? 'border-red-400' : ''}"
                placeholder="https://example.org/impressum"
            />
            {#if eventErrors.imprintUrl}<p class="mt-1 text-xs text-red-500">{eventErrors.imprintUrl}</p>{/if}
        </div>

        <div class="flex items-center gap-3 pt-2">
            <button class="btn-primary" onclick={handleEventSave} disabled={uploading}>Speichern</button>
            {#if saved}<span class="text-sm text-emerald-600" role="status">✓ Gespeichert!</span>{/if}
        </div>
    </div>

    <div class="card p-5">
        <ListEditor
            title="Kategorien"
            addTitle="Kategorie hinzufügen"
            editTitle="Kategorie bearbeiten"
            items={store.data.categories}
            emptyValues={{ label: "", color: "#3B82F6" }}
            toValues={(category) => ({ label: category.label, color: category.color })}
            validate={(values) => firstError(fieldErrors(CATEGORY_FIELDS, { ...values }, { required: REQUIRED_TEXTS }))}
            onSave={(values, editingId) => {
                if (editingId) {
                    store.actions.categories.update(editingId, values);
                } else {
                    store.actions.categories.add(values);
                }
            }}
            onDelete={(category) => store.actions.categories.remove(category.id)}
            confirmMessage={(category) => `Kategorie "${category.label}" wirklich löschen?`}
            row={categoryRow}
            fields={categoryFields}
        />
    </div>

    <div class="card p-5">
        <ListEditor
            title="Bereiche (A, B, C…)"
            addTitle="Bereich hinzufügen"
            editTitle="Bereich bearbeiten"
            items={store.data.groups}
            emptyValues={{ id: "", label: "", color: "#EF4444" }}
            toValues={(group) => ({ id: group.id, label: group.label, color: group.color })}
            validate={(values) => firstError(fieldErrors(groupSchema, { ...values }, { required: REQUIRED_TEXTS }))}
            onSave={(values, editingId) => {
                if (editingId) {
                    store.actions.groups.update(editingId, { label: values.label, color: values.color });
                    return;
                }
                if (store.data.groups.some((group) => group.id === values.id)) {
                    return `Bereichs-ID "${values.id}" existiert bereits.`;
                }
                store.actions.groups.add(values);
            }}
            onDelete={(group) => store.actions.groups.remove(group.id)}
            deleteBlocker={groupInUse}
            confirmMessage={(group) => `Bereich "${group.label}" wirklich löschen?`}
            row={groupRow}
            fields={groupFields}
        />
    </div>

    <div class="card p-5">
        <ListEditor
            title="Zweige"
            addTitle="Zweig hinzufügen"
            editTitle="Zweig bearbeiten"
            items={store.data.tracks}
            emptyValues={{ id: "", label: "", firstYear: "5", lastYear: "10", sections: true }}
            toValues={(track) => ({ ...track, firstYear: String(track.firstYear), lastYear: String(track.lastYear) })}
            validate={(values) => firstError(fieldErrors(trackSchema, toTrack(values), { required: REQUIRED_TEXTS, invalid: YEAR_TEXTS }))}
            onSave={(values, editingId) => {
                const track = toTrack(values);
                if (editingId) {
                    store.actions.tracks.update(editingId, { ...track, id: editingId });
                    return;
                }
                if (store.data.tracks.some((item) => item.id === track.id)) {
                    return `Das Kürzel "${track.id}" ist bereits vergeben.`;
                }
                store.actions.tracks.add(track);
            }}
            onDelete={(track) => store.actions.tracks.remove(track.id)}
            deleteBlocker={trackInUse}
            confirmMessage={(track) => `Zweig "${track.label}" wirklich löschen?`}
            row={trackRow}
            fields={trackFields}
        />
    </div>

    <div class="card p-5">
        <ListEditor
            title="Zeitslots"
            addTitle="Zeitslot hinzufügen"
            editTitle="Zeitslot bearbeiten"
            items={timeSlots}
            rowClass="space-y-1"
            emptyValues={{ start: "", end: "", label: "" }}
            toValues={(slot) => ({ start: slot.start, end: slot.end, label: slot.label ?? "" })}
            validate={(values) => firstError(fieldErrors(TIME_SLOT_FIELDS, { ...values }, { required: REQUIRED_TEXTS }))}
            onSave={(values, editingId) => {
                const slot = { ...values, label: values.label.trim() || undefined };
                if (editingId) {
                    store.actions.timeSlots.update(editingId, slot);
                } else {
                    store.actions.timeSlots.add(slot);
                }
            }}
            onDelete={(slot) => store.actions.timeSlots.remove(slot.id)}
            confirmMessage={(slot) => `Zeitslot ${slot.start}–${slot.end} löschen?`}
            row={timeSlotRow}
            fields={timeSlotFields}
        />
    </div>
</div>
