<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import { talkSchema } from "../../lib/schemas.ts";
    import type { Talk } from "../../lib/types.ts";

    export interface TalkFormValues {
        exhibitorId: string;
        startTime: string;
        durationMinutes: number;
        roomId: string;
        format: string;
        topic: string;
        notes: string;
    }

    export interface TalkSubmission {
        talk: TalkFormValues;
        newRoomName?: string;
    }

    const TALK_FORMATS = [
        "Vortrag",
        "Seminar",
        "Workshop",
        "Workshop (handwerklich)",
        "Mitmachaktion",
        "NaWi-Workshop",
        "ATA-Simulation",
    ];

    const DEFAULT_DURATION = 20;
    // The id is generated on save, so only the edited fields are validated
    const TALK_FIELDS = talkSchema.omit({ id: true });
    const FIELDS_WITH_ERRORS = ["exhibitorId", "startTime"];

    function toFormValues(talk: Talk | null): TalkFormValues {
        return {
            exhibitorId: talk?.exhibitorId ?? "",
            startTime: talk?.startTime ?? "",
            durationMinutes: talk?.durationMinutes ?? DEFAULT_DURATION,
            roomId: talk?.roomId ?? "",
            format: talk?.format ?? "Vortrag",
            topic: talk?.topic ?? "",
            notes: talk?.notes ?? "",
        };
    }
</script>

<script lang="ts">
    import { untrack } from "svelte";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { byGroupAndStand } from "../../lib/compare.ts";
    import { type FieldErrors, fieldErrors, otherErrors } from "../../lib/formErrors.ts";

    interface Props {
        initial: Talk | null;
        onSave: (submission: TalkSubmission) => void;
        onCancel: () => void;
    }

    let { initial, onSave, onCancel }: Props = $props();
    const store = getStore();
    const uid = $props.id();

    let form = $state(toFormValues(untrack(() => initial)));
    let errors = $state<FieldErrors>({});
    let generalError = $state("");
    let newRoomName = $state("");
    let roomDraft = $state("");
    let creatingRoom = $state(false);

    const sortedExhibitors = $derived([...store.data.exhibitors].sort(byGroupAndStand));
    // Keeps a format selectable that was removed from the list after the talk was saved
    const formats = $derived(TALK_FORMATS.includes(form.format) || !form.format ? TALK_FORMATS : [...TALK_FORMATS, form.format]);

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        errors = fieldErrors(TALK_FIELDS, form);
        // Both are optional in the data model, but a new or edited talk needs them
        if (!form.exhibitorId) {
            errors.exhibitorId = "Aussteller ist erforderlich";
        }
        if (!form.startTime) {
            errors.startTime = "Uhrzeit ist erforderlich";
        }
        generalError = otherErrors(errors, FIELDS_WITH_ERRORS);
        if (Object.keys(errors).length > 0) {
            return;
        }
        onSave({ talk: $state.snapshot(form), newRoomName: newRoomName || undefined });
    }

    function confirmNewRoom() {
        if (!roomDraft.trim()) {
            return;
        }
        newRoomName = roomDraft.trim();
        creatingRoom = false;
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4" novalidate>
    <div>
        <label class="label" for="{uid}-exhibitor">Aussteller <span class="text-red-500">*</span></label>
        <select id="{uid}-exhibitor" bind:value={form.exhibitorId} class="input {errors.exhibitorId ? 'border-red-400' : ''}">
            <option value="">– Aussteller wählen –</option>
            {#each store.data.groups as group (group.id)}
                {@const members = sortedExhibitors.filter((item) => item.groupId === group.id)}
                {#if members.length > 0}
                    <optgroup label={group.label}>
                        {#each members as exhibitor (exhibitor.id)}
                            <option value={exhibitor.id}>{exhibitor.id} – {exhibitor.name}</option>
                        {/each}
                    </optgroup>
                {/if}
            {/each}
        </select>
        {#if errors.exhibitorId}<p class="mt-1 text-xs text-red-500">{errors.exhibitorId}</p>{/if}
    </div>

    <div class="grid grid-cols-2 gap-4">
        <div>
            <label class="label" for="{uid}-time">Uhrzeit (Beginn) <span class="text-red-500">*</span></label>
            <input id="{uid}-time" type="time" bind:value={form.startTime} class="input {errors.startTime ? 'border-red-400' : ''}"/>
            {#if errors.startTime}<p class="mt-1 text-xs text-red-500">{errors.startTime}</p>{/if}
        </div>
        <div>
            <label class="label" for="{uid}-duration">Dauer (Minuten)</label>
            <input
                id="{uid}-duration"
                type="number"
                min="5"
                max="180"
                step="5"
                value={form.durationMinutes}
                oninput={(event) => (form.durationMinutes = parseInt(event.currentTarget.value, 10) || DEFAULT_DURATION)}
                class="input"
            />
        </div>
    </div>

    <div>
        <label class="label" for="{uid}-format">Format</label>
        <select id="{uid}-format" bind:value={form.format} class="input">
            {#each formats as format (format)}
                <option value={format}>{format}</option>
            {/each}
        </select>
    </div>

    <div>
        <label class="label" for={creatingRoom ? `${uid}-new-room` : `${uid}-room`}>Raum</label>
        {#if creatingRoom}
            <div class="flex gap-2">
                <input
                    {@attach (node) => node.focus()}
                    id="{uid}-new-room"
                    type="text"
                    bind:value={roomDraft}
                    class="input flex-1"
                    placeholder="z.B. Raum 047"
                />
                <button type="button" class="btn-primary text-xs" onclick={confirmNewRoom}>OK</button>
                <button type="button" class="btn-secondary text-xs" aria-label="Abbrechen" onclick={() => (creatingRoom = false)}>✕</button>
            </div>
        {:else}
            <div class="flex gap-2">
                <select id="{uid}-room" bind:value={form.roomId} class="input flex-1">
                    <option value="">– Raum wählen –</option>
                    {#each store.data.rooms as room (room.id)}
                        <option value={room.id}>{room.name}{room.floor ? ` (${room.floor}. Etage)` : ""}</option>
                    {/each}
                </select>
                <button type="button" class="btn-secondary text-xs whitespace-nowrap" onclick={() => (creatingRoom = true)}>
                    + Neuer Raum
                </button>
            </div>
        {/if}
        {#if newRoomName && !creatingRoom}
            <p class="mt-1 text-xs text-emerald-600">✓ Neuer Raum wird angelegt: <strong>{newRoomName}</strong></p>
        {/if}
    </div>

    <div>
        <label class="label" for="{uid}-topic">Thema / Titel</label>
        <input
            id="{uid}-topic"
            type="text"
            bind:value={form.topic}
            class="input"
            placeholder="z.B. Materialwissenschaften, Berufsausbildung zum…"
        />
    </div>

    <div>
        <label class="label" for="{uid}-notes">Anmerkungen</label>
        <input id="{uid}-notes" type="text" bind:value={form.notes} class="input" placeholder={"z.B. \"ggf. länger\""}/>
    </div>

    {#if generalError}
        <p class="text-sm text-red-600" role="alert">{generalError}</p>
    {/if}

    <div class="flex justify-end gap-2 border-t border-slate-100 pt-2">
        <button type="button" onclick={onCancel} class="btn-secondary">Abbrechen</button>
        <button type="submit" class="btn-primary">Speichern</button>
    </div>
</form>
