<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Lock from "@lucide/svelte/icons/lock";
    import { errorMessage, login } from "../../lib/client/remote.ts";
    import { fieldErrors, firstError } from "../../lib/formErrors.ts";
    import { loginSchema } from "../../lib/schemas.ts";

    let { next }: { next: string } = $props();

    let password = $state("");
    let error = $state("");
    let loading = $state(false);

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        error = firstError(fieldErrors(loginSchema, { password }, { required: { password: "Bitte Passwort eingeben." } })) ?? "";
        if (error) {
            return;
        }
        loading = true;
        try {
            await login(password);
            location.href = next;
        } catch (cause) {
            error = errorMessage(cause);
            password = "";
            loading = false;
        }
    }
</script>

<div class="flex min-h-screen items-center justify-center bg-navy-950 p-4">
    <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
            <div class="mb-4 flex justify-center">
                <Lock class="h-14 w-14 text-navy-400"/>
            </div>
            <h1 class="mb-2 font-display text-3xl text-white">Admin-Bereich</h1>
            <p class="text-sm text-navy-300">Verwaltung</p>
        </div>

        <form onsubmit={handleSubmit} class="rounded-2xl bg-white p-6 shadow-2xl">
            <label class="label" for="admin-password">Passwort</label>
            <input
                {@attach (node) => node.focus()}
                id="admin-password"
                type="password"
                autocomplete="current-password"
                bind:value={password}
                placeholder="Passwort eingeben"
                class="input mb-3"
                disabled={loading}
            />
            {#if error}
                <p class="mb-3 text-sm text-red-600" role="alert">{error}</p>
            {/if}
            <button type="submit" class="btn-primary w-full justify-center" disabled={loading}>
                {loading ? "Wird geprüft…" : "Anmelden"}
            </button>
        </form>

        <div class="mt-4 text-center">
            <a href="/" class="text-sm text-navy-300 transition-colors hover:text-white">← Zurück zur Webseite</a>
        </div>
    </div>
</div>
