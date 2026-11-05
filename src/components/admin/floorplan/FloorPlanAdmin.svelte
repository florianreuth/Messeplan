<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { getStore } from "../../../lib/client/store.svelte.ts";
    import { type Id, isRectShape } from "../../../lib/types.ts";
    import BoothPanel from "./BoothPanel.svelte";
    import EditorCanvas from "./EditorCanvas.svelte";
    import ExhibitorLists from "./ExhibitorLists.svelte";
    import { FloorEditor } from "./floorEditor.svelte.ts";
    import FloorTabs from "./FloorTabs.svelte";
    import LabelPanel from "./LabelPanel.svelte";
    import LinearShapePanel from "./LinearShapePanel.svelte";
    import RectShapePanel from "./RectShapePanel.svelte";
    import Toolbar from "./Toolbar.svelte";

    const store = getStore();
    let activeFloorId: Id | undefined = $state(store.data.floorPlan.floors[0]?.id);

    const floors = $derived(store.data.floorPlan.floors);
    // Falls back to the first floor when the active one was deleted, e.g. by another admin
    const activeFloor = $derived(floors.find((floor) => floor.id === activeFloorId) ?? floors[0]);
    // The editor is only used while a floor is rendered, and the server keeps at least one floor
    const editor = new FloorEditor(store, () => activeFloor!);

    const selection = $derived(editor.selection);
    const selectedShape = $derived(selection?.kind === "shape"
        ? activeFloor?.shapes.find((shape) => shape.id === selection.id)
        : undefined);

    function switchFloor(floorId: Id) {
        activeFloorId = floorId;
        editor.resetInteraction();
    }

    const deselect = () => (editor.selection = null);
</script>

{#if activeFloor}
    <div class="animate-fade-in space-y-4">
        <div>
            <h1 class="font-display text-2xl text-navy-900">Lageplan-Editor</h1>
            <p class="mt-1 text-sm text-slate-500">
                Aussteller platzieren, Beschriftungen, Pfeile und Flächen hinzufügen. Alle Elemente sind per
                Drag &amp; Drop verschiebbar.
            </p>
        </div>

        <FloorTabs {floors} activeFloorId={activeFloor.id} onSwitch={switchFloor}/>

        <Toolbar {editor} floor={activeFloor}/>

        <div class="flex flex-col gap-4 xl:flex-row">
            <div class="card flex-1 overflow-hidden">
                <div class="overflow-auto">
                    <EditorCanvas {editor} floor={activeFloor} exhibitors={store.data.exhibitors} groups={store.data.groups}/>
                </div>
            </div>

            <div class="space-y-3 xl:w-64">
                {#if selection?.kind === "booth"}
                    <BoothPanel id={selection.id} floor={activeFloor} onDeselect={deselect}/>
                {:else if selection?.kind === "label"}
                    <LabelPanel id={selection.id} floor={activeFloor} onDeselect={deselect}/>
                {:else if selectedShape && isRectShape(selectedShape)}
                    <RectShapePanel id={selectedShape.id} floor={activeFloor} onDeselect={deselect}/>
                {:else if selectedShape}
                    <LinearShapePanel id={selectedShape.id} floor={activeFloor} onDeselect={deselect}/>
                {:else if !selection}
                    <ExhibitorLists
                        pendingExhibitorId={editor.pendingExhibitorId}
                        onPendingChange={(id) => {
                            editor.pendingExhibitorId = id;
                            if (id) {
                                editor.tool = "select";
                            }
                        }}
                    />
                {/if}
            </div>
        </div>
    </div>
{/if}
