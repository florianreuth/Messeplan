<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts" module>
    export const SELECTION_COLOR = "#2563eb";
</script>

<script lang="ts">
    import { arrowHead, type Segment } from "../../lib/geometry.ts";
    import { DEFAULT_SHAPE_COLOR, solidFillVars, strokeVars } from "../../lib/planPalette.ts";
    import type { LinearShape } from "../../lib/types.ts";

    interface Props {
        shape: LinearShape;
        /** Overrides the shape's own color, e.g. for drawing previews. */
        color?: string;
        /** Uses the light/dark plan palette instead of the plain color (public plan). */
        themed?: boolean;
        selected?: boolean;
        /** Adds a wide invisible hit area so thin lines are easy to grab. */
        interactive?: boolean;
    }

    const DEFAULT_STROKE_WIDTH = 3;
    const MIN_HIT_WIDTH = 16;

    let { shape, color, themed = false, selected = false, interactive = false }: Props = $props();

    const segment: Segment = $derived({ x1: shape.x1, y1: shape.y1, x2: shape.x2, y2: shape.y2 });
    const strokeWidth = $derived(shape.strokeWidth || DEFAULT_STROKE_WIDTH);
    const head = $derived(shape.type === "arrow" ? arrowHead(segment) : null);
    const plain = $derived(selected ? SELECTION_COLOR : (color ?? shape.color ?? DEFAULT_SHAPE_COLOR));
    const usePalette = $derived(themed && !selected);
</script>

{#if shape.type !== "arrow" || head}
    <g>
        {#if interactive}
            <line {...segment} stroke="transparent" stroke-width={Math.max(strokeWidth + 10, MIN_HIT_WIDTH)}/>
        {/if}
        <line
            x1={segment.x1}
            y1={segment.y1}
            x2={head ? head.lineEnd.x : segment.x2}
            y2={head ? head.lineEnd.y : segment.y2}
            class={usePalette ? "plan-stroke" : undefined}
            style={usePalette ? strokeVars(color ?? shape.color, DEFAULT_SHAPE_COLOR) : undefined}
            stroke={usePalette ? undefined : plain}
            stroke-width={strokeWidth}
            stroke-linecap="round"
        />
        {#if head}
            <polygon
                points="{segment.x2},{segment.y2} {head.left.x},{head.left.y} {head.right.x},{head.right.y}"
                class={usePalette ? "plan-fill" : undefined}
                style={usePalette ? solidFillVars(color ?? shape.color, DEFAULT_SHAPE_COLOR) : undefined}
                fill={usePalette ? undefined : plain}
            />
        {/if}
        {#if selected}
            <circle cx={segment.x1} cy={segment.y1} r="5" fill="white" stroke={SELECTION_COLOR} stroke-width="2"/>
            <circle cx={segment.x2} cy={segment.y2} r="5" fill="white" stroke={SELECTION_COLOR} stroke-width="2"/>
        {/if}
    </g>
{/if}
