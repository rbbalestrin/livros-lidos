<script lang="ts">
	let { title, url, width = 72 }: { title: string; url?: string; width?: number } = $props();
	let failed = $state(false);
</script>

<div
	class="shrink-0 overflow-hidden rounded-sm bg-line shadow-sm ring-1 ring-black/5"
	style:width="{width}px"
	style:height="{Math.round(width * 1.5)}px"
>
	{#if url && !failed}
		<img
			src={url}
			alt=""
			loading="lazy"
			class="h-full w-full object-cover"
			onerror={() => (failed = true)}
		/>
	{:else}
		<div
			class="flex h-full items-center justify-center p-1.5 text-center font-serif text-[10px] leading-tight text-muted"
		>
			{title}
		</div>
	{/if}
</div>
