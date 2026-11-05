<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import X from "@lucide/svelte/icons/x";
    import { Dialog } from "bits-ui";
    import type { Snippet } from "svelte";
    import { SheetDrag } from "../../lib/ui/sheetDrag.svelte.ts";

    interface Props {
        title: string;
        onClose: () => void;
        children: Snippet;
    }

    let { title, onClose, children }: Props = $props();
    const drag = new SheetDrag(() => onClose());
</script>

<!-- Bottom sheet on mobile, centered dialog from sm on; mounted only while shown, like Modal -->
<Dialog.Root open onOpenChange={(open) => !open && onClose()}>
    <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-[60] animate-fade-in bg-black/50 dark:bg-black/70"/>
        <Dialog.Content>
            {#snippet child({ props })}
                <div class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
                    <div
                        {...props}
                        style={drag.panelStyle}
                        class="{drag.dragged ? '' : 'sheet-anim'} flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-sheet sm:max-h-[85vh] sm:max-w-lg sm:rounded-3xl sm:shadow-lift dark:bg-neutral-800"
                    >
                        <!-- The header is the drag handle on mobile; it is pointer-only, the close button stays keyboard accessible -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="shrink-0 cursor-grab pt-2 active:cursor-grabbing sm:cursor-auto sm:pt-0"
                            style="touch-action: none"
                            onpointerdown={drag.onpointerdown}
                            onpointermove={drag.onpointermove}
                            onpointerup={drag.onpointerup}
                            onpointercancel={drag.onpointercancel}
                            onclickcapture={drag.onclickcapture}
                        >
                            <div class="mx-auto mb-1 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-white/20"></div>
                            <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                                <Dialog.Title level={2} class="truncate font-display text-xl text-navy-900 dark:text-white">
                                    {title}
                                </Dialog.Title>
                                <Dialog.Close
                                    aria-label="Schließen"
                                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    <X class="h-5 w-5"/>
                                </Dialog.Close>
                            </div>
                        </div>
                        <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6">
                            {@render children()}
                        </div>
                    </div>
                </div>
            {/snippet}
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>
