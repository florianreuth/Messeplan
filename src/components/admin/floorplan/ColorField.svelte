<!--
  This project is proprietary software. All rights reserved.
  See the LICENSE file in the project root for details.

  Copyright (c) 2026 Florian Reuth <git@florianreuth.de>
-->

<script lang="ts">
    interface Props {
        label: string;
        value: string;
        onChange: (color: string) => void;
    }

    let { label, value, onChange }: Props = $props();
</script>

<label class="block">
    <span class="mb-1 block text-xs text-slate-400">{label}</span>
    <input
        type="color"
        {value}
        oninput={(event) => onChange(event.currentTarget.value)}
        class="h-9 w-full cursor-pointer rounded-sm border border-slate-200"
    />
</label>
