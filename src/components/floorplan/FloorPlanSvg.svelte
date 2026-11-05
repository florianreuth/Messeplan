<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    import { DEFAULT_GROUP_COLOR } from "../../lib/colors.ts";
    import {
        areaFillVars,
        DEFAULT_RECT_FILL,
        DEFAULT_RECT_STROKE,
        labelVars,
        strokeVars,
    } from "../../lib/planPalette.ts";
    import { type Exhibitor, type Floor, type Group, type Id, isLinearShape, isRectShape } from "../../lib/types.ts";
    import LinearShape from "./LinearShape.svelte";

    interface Props {
        floor: Floor;
        exhibitors: Exhibitor[];
        groups: Group[];
        selectedId?: Id | null;
        /** When set, all other booths are dimmed. */
        highlightIds?: Set<Id> | null;
        onSelect: (id: Id) => void;
        class?: string;
    }

    const PLAN_FONT = "DM Sans Variable, DM Sans, sans-serif";
    const DIMMED_OPACITY = 0.2;
    const LOGO_MIN_SIZE = 40;

    let { floor, exhibitors, groups, selectedId, highlightIds, onSelect, class: className }: Props = $props();

    const booths = $derived(floor.booths.flatMap((booth) => {
        const exhibitor = exhibitors.find((item) => item.id === booth.exhibitorId);
        if (!exhibitor) {
            return [];
        }
        const color = groups.find((item) => item.id === exhibitor.groupId)?.color ?? DEFAULT_GROUP_COLOR;
        const hasLogo = !!exhibitor.logoUrl && booth.width > LOGO_MIN_SIZE && booth.height > LOGO_MIN_SIZE;
        const fontSize = Math.max(12, Math.min(24, booth.width / 2.6));
        return [{ booth, exhibitor, color, hasLogo, fontSize }];
    }));

    function onKeyDown(event: KeyboardEvent, id: Id) {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }
        event.preventDefault();
        onSelect(id);
    }
</script>

<svg viewBox="0 0 {floor.width} {floor.height}" class={className} role="img" aria-label="Lageplan {floor.label}">
    <rect width={floor.width} height={floor.height} class="plan-background"/>

    {#each floor.shapes.filter(isRectShape) as shape (shape.id)}
        <g>
            <rect
                x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx="6"
                class="plan-fill plan-stroke"
                style="{areaFillVars(shape.fill, DEFAULT_RECT_FILL)}; {strokeVars(shape.stroke, DEFAULT_RECT_STROKE)}"
                stroke-width={shape.strokeWidth || 1.5}
            />
            {#if shape.label}
                <text
                    x={shape.x + shape.width / 2} y={shape.y + shape.height / 2}
                    text-anchor="middle" dominant-baseline="middle"
                    font-size={shape.fontSize || 13} font-family={PLAN_FONT} font-weight="600"
                    class="plan-fill" style="{labelVars(shape.textColor)}; pointer-events: none"
                >
                    {shape.label}
                </text>
            {/if}
        </g>
    {/each}

    {#each floor.shapes.filter(isLinearShape) as shape (shape.id)}
        <LinearShape {shape} themed/>
    {/each}

    {#each booths as { booth, exhibitor, color, hasLogo, fontSize } (booth.exhibitorId)}
        {@const selected = selectedId === exhibitor.id}
        <g
            role="button"
            tabindex="0"
            aria-label="Stand {exhibitor.id}: {exhibitor.name}"
            onclick={() => onSelect(exhibitor.id)}
            onkeydown={(event) => onKeyDown(event, exhibitor.id)}
            style="cursor: pointer; opacity: {highlightIds && !highlightIds.has(exhibitor.id) ? DIMMED_OPACITY : 1}; transition: opacity 0.2s"
        >
            <rect
                x={booth.x} y={booth.y} width={booth.width} height={booth.height} rx="5"
                fill={color} fill-opacity={selected ? 1 : 0.9}
                stroke={selected ? "#ffffff" : color} stroke-width={selected ? 3 : 1}
            />
            {#if selected}
                <rect
                    x={booth.x - 3} y={booth.y - 3} width={booth.width + 6} height={booth.height + 6} rx="8"
                    fill="none" stroke={color} stroke-width="2.5"
                />
            {/if}
            {#if hasLogo}
                <image
                    href={exhibitor.logoUrl}
                    x={booth.x + 4} y={booth.y + 3}
                    width={Math.max(0, booth.width - 8)}
                    height={Math.max(0, booth.height - fontSize - 8)}
                    preserveAspectRatio="xMidYMid meet"
                    style="pointer-events: none"
                />
            {/if}
            <text
                x={booth.x + booth.width / 2}
                y={hasLogo ? booth.y + booth.height - 4 : booth.y + booth.height / 2}
                text-anchor="middle"
                dominant-baseline={hasLogo ? "auto" : "middle"}
                font-size={fontSize} font-weight="700" fill="white"
                font-family={PLAN_FONT} style="pointer-events: none"
            >
                {exhibitor.id}
            </text>
        </g>
    {/each}

    {#each floor.labels as label (label.id)}
        <text
            x={label.x} y={label.y}
            font-size={label.fontSize || 14} font-family={PLAN_FONT} font-weight="600"
            class="plan-fill" style="{labelVars(label.color)}; pointer-events: none"
        >
            {label.text}
        </text>
    {/each}
</svg>
