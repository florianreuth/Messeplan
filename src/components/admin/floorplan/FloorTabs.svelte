<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import Plus from "@lucide/svelte/icons/plus";
    import X from "@lucide/svelte/icons/x";
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import { createId } from "../../../lib/id.ts";
    import type { Floor, Id } from "../../../lib/types.ts";
    import ConfirmModal from "../../ui/ConfirmModal.svelte";

    interface Props {
        floors: Floor[];
        activeFloorId: Id;
        onSwitch: (id: Id) => void;
    }

    let { floors, activeFloorId, onSwitch }: Props = $props();
    const store = getStore();
    let renamingId: Id | null = $state(null);
    let draft = $state("");
    let deleting: Floor | null = $state(null);

    const hasContent = (floor: Floor) => floor.booths.length > 0 || floor.labels.length > 0 || floor.shapes.length > 0;
    const focus = (node: HTMLInputElement) => node.focus();

    function startRename(floor: Floor) {
        renamingId = floor.id;
        draft = floor.label;
    }

    function commitRename(floorId: Id) {
        if (renamingId !== floorId) {
            return;
        }
        if (draft.trim()) {
            store.actions.floors.update(floorId, { label: draft.trim() });
        }
        renamingId = null;
    }

    function removeFloor(floor: Floor) {
        if (floors.length <= 1) {
            return;
        }
        store.actions.floors.remove(floor.id);
        if (floor.id === activeFloorId) {
            const remaining = floors.find((item) => item.id !== floor.id);
            if (remaining) {
                onSwitch(remaining.id);
            }
        }
    }

    function requestRemove(floor: Floor) {
        if (hasContent(floor)) {
            deleting = floor;
        } else {
            removeFloor(floor);
        }
    }

    function addFloor() {
        const id = createId();
        store.actions.floors.add(floors.length === 1 ? "1. OG" : `${floors.length}. OG`, id);
        onSwitch(id);
    }
</script>

<div class="flex items-end gap-0 border-b border-slate-200" role="tablist" aria-label="Etagen">
    {#each floors as floor (floor.id)}
        {@const active = floor.id === activeFloorId}
        <div
            role="tab"
            tabindex="0"
            aria-selected={active}
            class="group relative -mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-all {active ? 'border-navy-900 bg-white text-navy-900' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
            onclick={() => onSwitch(floor.id)}
            ondblclick={() => startRename(floor)}
            onkeydown={(event) => {
                if (event.target !== event.currentTarget) {
                    return;
                }
                if (event.key === "Enter" || event.key === " ") {
                    onSwitch(floor.id);
                }
                if (event.key === "F2") {
                    startRename(floor);
                }
            }}
        >
            {#if renamingId === floor.id}
                <input
                    {@attach focus}
                    bind:value={draft}
                    aria-label="Name der Etage"
                    onblur={() => commitRename(floor.id)}
                    onkeydown={(event) => {
                        if (event.key === "Enter") {
                            event.currentTarget.blur();
                        }
                        if (event.key === "Escape") {
                            renamingId = null;
                        }
                    }}
                    onclick={(event) => event.stopPropagation()}
                    class="w-28 border-b border-navy-900 bg-transparent text-sm font-medium outline-hidden"
                />
            {:else}
                <span>{floor.label}</span>
            {/if}

            {#if floors.length > 1}
                <button
                    title="Etage löschen"
                    aria-label="Etage {floor.label} löschen"
                    onclick={(event) => {
                        event.stopPropagation();
                        requestRemove(floor);
                    }}
                    class="ml-0.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500 focus-visible:opacity-100"
                >
                    <X class="h-3 w-3"/>
                </button>
            {/if}
        </div>
    {/each}

    <button
        title="Etage hinzufügen"
        onclick={addFloor}
        class="flex items-center gap-1 px-3 py-2.5 text-sm text-slate-500 transition-colors hover:text-navy-700"
    >
        <Plus class="h-4 w-4"/> Etage
    </button>
    <span class="mb-2.5 ml-2 self-end text-xs text-slate-400">Doppelklick zum Umbenennen</span>
</div>

{#if deleting}
    {@const floor = deleting}
    <ConfirmModal
        message={`„${floor.label}" hat Inhalte. Wirklich löschen?`}
        onConfirm={() => {
            removeFloor(floor);
            deleting = null;
        }}
        onCancel={() => (deleting = null)}
    />
{/if}
