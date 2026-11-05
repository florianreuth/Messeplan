<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { Dialog } from "bits-ui";
    import type { Snippet } from "svelte";

    type ModalSize = "sm" | "md" | "lg" | "xl";

    interface Props {
        title: string;
        onClose: () => void;
        size?: ModalSize;
        children: Snippet;
    }

    const WIDTHS: Record<ModalSize, string> = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    let { title, onClose, size = "md", children }: Props = $props();
</script>

<!-- Callers mount the modal only while it is shown, so it is always open and closing is reported via onClose -->
<Dialog.Root open onOpenChange={(open) => !open && onClose()}>
    <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 animate-fade-in bg-black/85"/>
        <Dialog.Content>
            {#snippet child({ props })}
                <!-- The centering wrapper lies outside the dialog element, so clicks on it close like a backdrop click -->
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        {...props}
                        class="flex max-h-[90vh] w-full animate-scale-in flex-col rounded-3xl bg-white shadow-[0_32px_64px_rgba(0,0,0,0.4)] ring-1 ring-slate-900/10 {WIDTHS[size]}"
                    >
                        <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
                            <Dialog.Title level={2} class="font-display text-xl text-navy-900">{title}</Dialog.Title>
                            <Dialog.Close
                                aria-label="Schließen"
                                class="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            >
                                ×
                            </Dialog.Close>
                        </div>
                        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            {@render children()}
                        </div>
                    </div>
                </div>
            {/snippet}
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>
