<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Clock from "@lucide/svelte/icons/clock";
    import Mail from "@lucide/svelte/icons/mail";
    import MapPin from "@lucide/svelte/icons/map-pin";
    import Mic from "@lucide/svelte/icons/mic";
    import User from "@lucide/svelte/icons/user";
    import { getStore } from "../../lib/client/store.svelte.ts";
    import { DEFAULT_GROUP_COLOR } from "../../lib/colors.ts";
    import { byStartTime } from "../../lib/compare.ts";
    import type { Exhibitor, Group } from "../../lib/types.ts";
    import CategoryBadge from "../ui/CategoryBadge.svelte";

    interface Props {
        exhibitor: Exhibitor;
        group?: Group;
    }

    let { exhibitor, group }: Props = $props();
    const store = getStore();

    const talks = $derived(store.data.talks.filter((talk) => talk.exhibitorId === exhibitor.id).sort(byStartTime));
    const hasContactDetails = $derived(!!(exhibitor.contact || exhibitor.contactEmail || exhibitor.locationNote));

    function talkMeta(format?: string, duration?: number, roomId?: string): string {
        const room = store.data.rooms.find((item) => item.id === roomId)?.name;
        return [format, duration && `${duration} Min.`, room].filter(Boolean).join(" · ");
    }
</script>

<div>
    <div class="flex items-center gap-3">
        {#if exhibitor.logoUrl}
            <img
                src={exhibitor.logoUrl} alt="" width="56" height="56"
                class="h-14 w-14 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain dark:border-white/10"
            />
        {:else}
            <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold text-white"
                style="background-color: {group?.color ?? DEFAULT_GROUP_COLOR}"
            >
                {exhibitor.id}
            </div>
        {/if}
        <div class="min-w-0">
            <p class="leading-snug font-semibold text-slate-900 dark:text-white">{exhibitor.name}</p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
                {#if group}
                    <span
                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style="background-color: {group.color}"
                    >
                        {group.label}
                    </span>
                {/if}
                <CategoryBadge categoryId={exhibitor.categoryId} size="xs"/>
            </div>
        </div>
    </div>

    {#if exhibitor.description}
        <p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-neutral-300">{exhibitor.description}</p>
    {/if}

    {#if hasContactDetails}
        <div class="mt-4 space-y-2 text-sm">
            {#if exhibitor.locationNote}
                <div class="flex items-start gap-2 rounded-xl bg-gold-50 px-3 py-2 text-gold-600 dark:bg-gold-400/10 dark:text-gold-400">
                    <MapPin class="mt-0.5 h-4 w-4 shrink-0"/>
                    <span class="font-medium">{exhibitor.locationNote}</span>
                </div>
            {/if}
            {#if exhibitor.contact}
                <div class="flex items-center gap-2 text-slate-600 dark:text-neutral-300">
                    <User class="h-4 w-4 shrink-0 text-slate-400"/>
                    <span>{exhibitor.contact}</span>
                </div>
            {/if}
            {#if exhibitor.contactEmail}
                <div class="flex items-center gap-2">
                    <Mail class="h-4 w-4 shrink-0 text-slate-400"/>
                    <a href="mailto:{exhibitor.contactEmail}" class="break-all text-navy-600 hover:underline dark:text-neutral-200">
                        {exhibitor.contactEmail}
                    </a>
                </div>
            {/if}
        </div>
    {/if}

    {#if talks.length > 0}
        <div class="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
            <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-neutral-200">
                <Mic class="h-4 w-4 text-navy-500 dark:text-neutral-400"/>
                {talks.length === 1 ? "1 Vortrag" : `${talks.length} Vorträge & Workshops`}
            </h3>
            <div class="space-y-1.5">
                {#each talks as talk (talk.id)}
                    <div class="flex items-start gap-3 rounded-xl bg-navy-50/70 px-3 py-2 text-sm dark:bg-white/5">
                        <span class="tnum flex shrink-0 items-center gap-1 font-semibold text-navy-800 dark:text-neutral-200">
                            <Clock class="h-3.5 w-3.5 text-navy-400 dark:text-neutral-400"/>
                            {talk.startTime || "—"}
                        </span>
                        <div class="min-w-0">
                            {#if talk.topic}
                                <p class="text-slate-700 dark:text-neutral-200">{talk.topic}</p>
                            {/if}
                            <p class="text-xs text-slate-500 dark:text-neutral-400">
                                {talkMeta(talk.format, talk.durationMinutes, talk.roomId)}
                            </p>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
