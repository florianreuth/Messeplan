<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import { classIdFor, trackYears } from "../../lib/classes.ts";
    import { classSchema } from "../../lib/schemas.ts";
    import type { SchoolClass, Track } from "../../lib/types.ts";

    interface ClassFormValues {
        id?: string;
        track: string;
        year: string;
        section: string;
        studentCount: string;
        teachers: string;
        notes: string;
    }

    // Up to this many years are offered as buttons, longer ranges as a select
    const MAX_YEAR_BUTTONS = 4;

    function defaultsFor(track: Track | undefined): Pick<ClassFormValues, "track" | "year" | "section"> {
        return { track: track?.id ?? "", year: track ? String(track.firstYear) : "", section: track?.sections ? "a" : "" };
    }

    function toFormValues(schoolClass: SchoolClass | null, firstTrack: Track | undefined): ClassFormValues {
        if (!schoolClass) {
            return { ...defaultsFor(firstTrack), studentCount: "", teachers: "", notes: "" };
        }
        return {
            id: schoolClass.id,
            track: schoolClass.track,
            year: String(schoolClass.year),
            section: schoolClass.section ?? "",
            studentCount: schoolClass.studentCount ? String(schoolClass.studentCount) : "",
            teachers: (schoolClass.teachers ?? []).join(", "),
            notes: schoolClass.notes ?? "",
        };
    }

    function toSchoolClass(values: ClassFormValues, track: Track | undefined): SchoolClass {
        const year = parseInt(values.year, 10);
        const section = track?.sections ? values.section : "";
        return {
            id: values.id || (track ? classIdFor(track, year, section) : ""),
            track: values.track,
            year,
            section: section || undefined,
            studentCount: parseInt(values.studentCount, 10) || 0,
            teachers: values.teachers.split(",").map((name) => name.trim()).filter(Boolean),
            notes: values.notes.trim() || undefined,
        };
    }
</script>

<script lang="ts">
    import { untrack } from "svelte";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { fieldErrors, otherErrors } from "../../lib/formErrors.ts";

    interface Props {
        initial: SchoolClass | null;
        /** Returns an error message to keep the form open. */
        onSave: (schoolClass: SchoolClass) => string | void;
        onCancel: () => void;
    }

    let { initial, onSave, onCancel }: Props = $props();
    const uid = $props.id();

    const store = getStore();
    const tracks = $derived(store.data.tracks);

    let form = $state(toFormValues(untrack(() => initial), untrack(() => store.data.tracks[0])));
    let yearError = $state("");
    let saveError = $state("");

    const isEditing = $derived(!!form.id);
    const track = $derived(tracks.find((item) => item.id === form.track));
    const years = $derived(track ? trackYears(track).map(String) : []);
    const previewId = $derived(toSchoolClass(form, track).id);

    function handleTrackChange(id: string) {
        if (isEditing) {
            return;
        }
        form = { ...form, ...defaultsFor(tracks.find((item) => item.id === id)) };
    }

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        if (!track) {
            saveError = "Bitte zuerst unter Einstellungen einen Zweig anlegen.";
            return;
        }
        const schoolClass = toSchoolClass(form, track);
        const errors = fieldErrors(classSchema, schoolClass, { required: { year: "Pflichtfeld" } });
        yearError = form.year ? errors.year ?? "" : "Pflichtfeld";
        saveError = otherErrors(errors, ["year"]);
        if (yearError || saveError) {
            return;
        }
        saveError = onSave(schoolClass) ?? "";
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4" novalidate>
    <div>
        <label class="label" for="{uid}-track">Zweig <span class="text-red-500">*</span></label>
        <select
            id="{uid}-track"
            value={form.track}
            onchange={(event) => handleTrackChange(event.currentTarget.value)}
            class="input"
            disabled={isEditing}
        >
            {#each tracks as option (option.id)}
                <option value={option.id}>{option.id} – {option.label}</option>
            {/each}
        </select>
    </div>

    <div>
        {#if years.length <= MAX_YEAR_BUTTONS}
            <span class="label" id="{uid}-year-label">Jahrgangsstufe <span class="text-red-500">*</span></span>
            <div class="flex gap-2" role="group" aria-labelledby="{uid}-year-label">
                {#each years as year (year)}
                    <button
                        type="button"
                        onclick={() => (form.year = year)}
                        disabled={isEditing}
                        aria-pressed={form.year === year}
                        class="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all {form.year === year ? 'border-navy-900 bg-navy-900 text-white shadow-xs' : 'border-slate-200 text-slate-600 hover:border-navy-300 hover:text-navy-700'} {isEditing ? 'cursor-not-allowed opacity-50' : ''}"
                    >
                        {year}
                    </button>
                {/each}
            </div>
        {:else}
            <label class="label" for="{uid}-year">Jahrgangsstufe <span class="text-red-500">*</span></label>
            <select id="{uid}-year" bind:value={form.year} class="input {yearError ? 'border-red-400' : ''}" disabled={isEditing}>
                {#each years as year (year)}
                    <option value={year}>{year}</option>
                {/each}
            </select>
        {/if}
        {#if yearError}<p class="mt-1 text-xs text-red-500">{yearError}</p>{/if}
    </div>

    {#if track?.sections}
        <div>
            <label class="label" for="{uid}-section">Klasse</label>
            <input
                id="{uid}-section"
                type="text"
                maxlength="2"
                value={form.section}
                oninput={(event) => (form.section = event.currentTarget.value.toLowerCase())}
                class="input"
                placeholder="a"
                disabled={isEditing}
            />
        </div>
    {/if}

    {#if previewId}
        <p class="-mt-2 text-sm text-slate-500">Klassen-ID: <strong class="font-mono">{previewId}</strong></p>
    {/if}

    <div>
        <label class="label" for="{uid}-students">Anzahl Schüler/innen (SuS)</label>
        <input
            id="{uid}-students"
            type="number"
            min="0"
            max="60"
            value={form.studentCount}
            oninput={(event) => (form.studentCount = event.currentTarget.value)}
            class="input"
            placeholder="z.B. 28"
        />
    </div>

    <div>
        <label class="label" for="{uid}-teachers">Begleitende Lehrkräfte</label>
        <input
            id="{uid}-teachers"
            type="text"
            bind:value={form.teachers}
            class="input"
            placeholder="Müller, Schmidt (kommagetrennt)"
        />
        <p class="mt-1 text-xs text-slate-400">Mehrere Namen mit Komma trennen</p>
    </div>

    <div>
        <label class="label" for="{uid}-notes">Anmerkungen</label>
        <input
            id="{uid}-notes"
            type="text"
            bind:value={form.notes}
            class="input"
            placeholder="z.B. Begleitung durch das Messeteam"
        />
    </div>

    {#if saveError}
        <p class="text-sm text-red-600" role="alert">{saveError}</p>
    {/if}

    <div class="flex justify-end gap-2 border-t border-slate-100 pt-2">
        <button type="button" onclick={onCancel} class="btn-secondary">Abbrechen</button>
        <button type="submit" class="btn-primary">Speichern</button>
    </div>
</form>
