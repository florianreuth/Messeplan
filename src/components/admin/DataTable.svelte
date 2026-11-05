<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    import type { Snippet } from "svelte";

    export type ColumnVisibility = "always" | "sm" | "md" | "lg";

    export interface Column<T> {
        key: string;
        header: string;
        /** Breakpoint from which the column is shown. */
        from?: ColumnVisibility;
        class?: string;
        cell: Snippet<[T]>;
    }
</script>

<script lang="ts" generics="T">
    import Pencil from "@lucide/svelte/icons/pencil";
    import Trash2 from "@lucide/svelte/icons/trash";

    interface Props {
        columns: Column<T>[];
        rows: T[];
        rowKey: (item: T) => string;
        onEdit?: (item: T) => void;
        onDelete?: (item: T) => void;
        rowActions?: Snippet<[T]>;
        empty: Snippet;
    }

    const VISIBILITY: Record<ColumnVisibility, string> = {
        always: "",
        sm: "hidden sm:table-cell",
        md: "hidden md:table-cell",
        lg: "hidden lg:table-cell",
    };

    let { columns, rows, rowKey, onEdit, onDelete, rowActions, empty }: Props = $props();
    const hasActions = $derived(!!onEdit || !!onDelete || !!rowActions);
</script>

{#if rows.length === 0}
    {@render empty()}
{:else}
    <div class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
                {#each columns as column (column.key)}
                    <th class="px-4 py-3 text-left font-medium text-slate-600 {VISIBILITY[column.from ?? 'always']}">
                        {column.header}
                    </th>
                {/each}
                {#if hasActions}
                    <th class="px-4 py-3"><span class="sr-only">Aktionen</span></th>
                {/if}
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            {#each rows as row (rowKey(row))}
                <tr class="transition-colors hover:bg-slate-50">
                    {#each columns as column (column.key)}
                        <td class="px-4 py-3 {VISIBILITY[column.from ?? 'always']} {column.class ?? ''}">
                            {@render column.cell(row)}
                        </td>
                    {/each}
                    {#if hasActions}
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-end gap-1">
                                {@render rowActions?.(row)}
                                {#if onEdit}
                                    <button class="btn-ghost px-2 py-1 text-xs" aria-label="Bearbeiten" onclick={() => onEdit(row)}>
                                        <Pencil class="h-3.5 w-3.5"/>
                                    </button>
                                {/if}
                                {#if onDelete}
                                    <button
                                        class="btn-ghost px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                                        aria-label="Löschen"
                                        onclick={() => onDelete(row)}
                                    >
                                        <Trash2 class="h-3.5 w-3.5"/>
                                    </button>
                                {/if}
                            </div>
                        </td>
                    {/if}
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
{/if}
