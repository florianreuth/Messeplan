<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import { exhibitorSchema } from "../../lib/schemas.ts";
    import type { Exhibitor } from "../../lib/types.ts";

    interface ExhibitorFormValues {
        id: string;
        groupId: string;
        standNumber: string;
        name: string;
        categoryId: string;
        description: string;
        contact: string;
        contactEmail: string;
        logoUrl: string;
        locationNote: string;
        website: string;
    }

    const FIELDS_WITH_INPUT = ["id", "groupId", "name", "contactEmail"];

    const MAX_LOGO_BYTES = 2 * 1024 * 1024;

    function toFormValues(exhibitor: Exhibitor | null): ExhibitorFormValues {
        return {
            id: exhibitor?.id ?? "",
            groupId: exhibitor?.groupId ?? "",
            standNumber: exhibitor?.standNumber ? String(exhibitor.standNumber) : "",
            name: exhibitor?.name ?? "",
            categoryId: exhibitor?.categoryId ?? "",
            description: exhibitor?.description ?? "",
            contact: exhibitor?.contact ?? "",
            contactEmail: exhibitor?.contactEmail ?? "",
            logoUrl: exhibitor?.logoUrl ?? "",
            locationNote: exhibitor?.locationNote ?? "",
            website: exhibitor?.website ?? "",
        };
    }

    function derivedId(groupId: string, standNumber: string): string {
        return groupId && standNumber ? `${groupId}${standNumber}` : "";
    }

    function toExhibitor(values: ExhibitorFormValues): Exhibitor {
        const optional = (value: string) => value.trim() || undefined;
        return {
            id: values.id.trim(),
            name: values.name.trim(),
            groupId: optional(values.groupId),
            categoryId: optional(values.categoryId),
            standNumber: parseInt(values.standNumber, 10) || 1,
            description: optional(values.description),
            contact: optional(values.contact),
            contactEmail: optional(values.contactEmail),
            logoUrl: optional(values.logoUrl),
            locationNote: optional(values.locationNote),
            website: optional(values.website),
        };
    }
</script>

<script lang="ts">
    import Camera from "@lucide/svelte/icons/camera";
    import { untrack } from "svelte";
    import { errorMessage, uploadImage } from "../../lib/client/remote.ts";
    import { type FieldErrors, fieldErrors, otherErrors } from "../../lib/formErrors.ts";
    import { getStore } from "../../lib/client/store.svelte.ts";

    interface Props {
        initial: Exhibitor | null;
        /** Returns an error message to keep the form open. */
        onSave: (exhibitor: Exhibitor) => string | void;
        onCancel: () => void;
    }

    let { initial, onSave, onCancel }: Props = $props();
    const store = getStore();
    const uid = $props.id();

    let form = $state(toFormValues(untrack(() => initial)));
    let errors = $state<FieldErrors>({});
    let saveError = $state("");
    let logoError = $state("");
    let uploading = $state(false);
    let logoInput: HTMLInputElement | undefined = $state();

    function setIdSource(field: "groupId" | "standNumber", value: string) {
        const linked = form.id === derivedId(form.groupId, form.standNumber);
        form[field] = value;
        if (linked) {
            form.id = derivedId(form.groupId, form.standNumber);
        }
    }

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        const exhibitor = toExhibitor(form);
        errors = fieldErrors(exhibitorSchema, exhibitor, {
            required: { name: "Name ist erforderlich", id: "Stand-ID ist erforderlich" },
        });
        // The schema allows exhibitors without a zone (e.g. after imports), new entries need one
        if (!form.groupId) {
            errors.groupId = "Bereich ist erforderlich";
        }
        saveError = otherErrors(errors, FIELDS_WITH_INPUT);
        if (Object.keys(errors).length > 0) {
            return;
        }
        saveError = onSave(exhibitor) ?? "";
    }

    async function handleLogo(event: Event & { currentTarget: HTMLInputElement }) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) {
            return;
        }
        logoError = "";
        uploading = true;
        try {
            form.logoUrl = await uploadImage(file, MAX_LOGO_BYTES);
        } catch (cause) {
            logoError = errorMessage(cause);
        } finally {
            uploading = false;
        }
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4" novalidate>
    <div class="grid grid-cols-3 gap-4">
        <div>
            <label class="label" for="{uid}-group">Bereich <span class="text-red-500">*</span></label>
            <select
                id="{uid}-group"
                value={form.groupId}
                onchange={(event) => setIdSource("groupId", event.currentTarget.value)}
                class="input {errors.groupId ? 'border-red-400' : ''}"
            >
                <option value="">– Bereich wählen –</option>
                {#each store.data.groups as group (group.id)}
                    <option value={group.id}>{group.label}</option>
                {/each}
            </select>
            {#if errors.groupId}<p class="mt-1 text-xs text-red-500">{errors.groupId}</p>{/if}
        </div>
        <div>
            <label class="label" for="{uid}-stand">Stand-Nr.</label>
            <input
                id="{uid}-stand"
                type="number"
                min="1"
                value={form.standNumber}
                oninput={(event) => setIdSource("standNumber", event.currentTarget.value)}
                class="input"
                placeholder="z.B. 3"
            />
        </div>
        <div>
            <label class="label" for="{uid}-id">Stand-ID <span class="text-red-500">*</span></label>
            <input
                id="{uid}-id"
                type="text"
                bind:value={form.id}
                class="input {errors.id ? 'border-red-400' : ''}"
                placeholder="z.B. A3"
            />
            {#if errors.id}<p class="mt-1 text-xs text-red-500">{errors.id}</p>{/if}
        </div>
    </div>

    <div>
        <label class="label" for="{uid}-name">Name / Firma <span class="text-red-500">*</span></label>
        <input
            id="{uid}-name"
            type="text"
            bind:value={form.name}
            class="input {errors.name ? 'border-red-400' : ''}"
            placeholder="z.B. Muster GmbH"
        />
        {#if errors.name}<p class="mt-1 text-xs text-red-500">{errors.name}</p>{/if}
    </div>

    <div>
        <label class="label" for="{uid}-category">Kategorie</label>
        <select id="{uid}-category" bind:value={form.categoryId} class="input">
            <option value="">– Keine Kategorie –</option>
            {#each store.data.categories as category (category.id)}
                <option value={category.id}>{category.label}</option>
            {/each}
        </select>
    </div>

    <div>
        <label class="label" for="{uid}-contact">Ansprechpartner</label>
        <input id="{uid}-contact" type="text" bind:value={form.contact} class="input" placeholder="Name des Ansprechpartners"/>
    </div>

    <div>
        <label class="label" for="{uid}-email">E-Mail</label>
        <input
            id="{uid}-email"
            type="email"
            bind:value={form.contactEmail}
            class="input {errors.contactEmail ? 'border-red-400' : ''}"
            placeholder="info@beispiel.de"
        />
        {#if errors.contactEmail}<p class="mt-1 text-xs text-red-500">{errors.contactEmail}</p>{/if}
    </div>

    <div>
        <label class="label" for="{uid}-location">Standort-Hinweis</label>
        <input id="{uid}-location" type="text" bind:value={form.locationNote} class="input" placeholder={"z.B. \"auch Haupteingang\""}/>
    </div>

    <div>
        <label class="label" for="{uid}-description">Beschreibung</label>
        <textarea
            id="{uid}-description"
            bind:value={form.description}
            class="input resize-none"
            rows="3"
            placeholder="Kurzbeschreibung des Unternehmens / der Institution"
        ></textarea>
    </div>

    <div>
        <span class="label">Logo</span>
        <div class="flex items-center gap-3">
            {#if form.logoUrl}
                <div class="relative">
                    <img src={form.logoUrl} alt="" class="h-16 w-16 rounded-lg border border-slate-200 object-contain"/>
                    <button
                        type="button"
                        onclick={() => (form.logoUrl = "")}
                        aria-label="Logo entfernen"
                        class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                    >
                        ×
                    </button>
                </div>
            {:else}
                <div class="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-center text-xs text-slate-400">
                    Kein Logo
                </div>
            {/if}
            <button
                type="button"
                onclick={() => logoInput?.click()}
                class="btn-secondary flex items-center gap-1.5 text-xs"
                disabled={uploading}
            >
                <Camera class="h-3.5 w-3.5"/> {uploading ? "Wird hochgeladen…" : "Logo hochladen"}
            </button>
            <input
                bind:this={logoInput}
                type="file"
                accept="image/*"
                class="hidden"
                aria-label="Logo-Datei wählen"
                onchange={handleLogo}
            />
        </div>
        {#if logoError}<p class="mt-1 text-xs text-red-500">{logoError}</p>{/if}
        <p class="mt-1 text-xs text-slate-400">Max. 2 MB · PNG, JPG oder SVG</p>
    </div>

    {#if saveError}
        <p class="text-sm text-red-600" role="alert">{saveError}</p>
    {/if}

    <div class="flex justify-end gap-2 border-t border-slate-100 pt-2">
        <button type="button" onclick={onCancel} class="btn-secondary">Abbrechen</button>
        <button type="submit" class="btn-primary" disabled={uploading}>Speichern</button>
    </div>
</form>
