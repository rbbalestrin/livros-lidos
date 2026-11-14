<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	/** Rating in half stars, 1 to 10. */
	let {
		value = $bindable(),
		readonly = false,
		size = 'md'
	}: { value?: number; readonly?: boolean; size?: 'sm' | 'md' } = $props();

	let hover = $state<number | undefined>();
	const shown = $derived(hover ?? value ?? 0);
	const px = $derived(size === 'sm' ? 14 : 26);
	const label = $derived(m.rating_label({ stars: String((value ?? 0) / 2) }));

	const fill = (star: number) => Math.max(0, Math.min(1, (shown - (star - 1) * 2) / 2));
</script>

{#snippet star(fraction: number)}
	<span class="relative inline-block" style:width="{px}px" style:height="{px}px">
		<svg
			viewBox="0 0 24 24"
			class="absolute inset-0 text-line"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
		</svg>
		<span class="absolute inset-0 overflow-hidden" style:width="{fraction * 100}%">
			<svg
				viewBox="0 0 24 24"
				class="text-star"
				fill="currentColor"
				aria-hidden="true"
				style:width="{px}px"
				style:height="{px}px"
			>
				<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
			</svg>
		</span>
	</span>
{/snippet}

{#if readonly}
	<span class="inline-flex" role="img" aria-label={label}>
		{#each [1, 2, 3, 4, 5] as s (s)}{@render star(fill(s))}{/each}
	</span>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<span class="inline-flex items-center gap-3" onmouseleave={() => (hover = undefined)}>
		<span class="inline-flex" role="radiogroup" aria-label={m.log_rating()}>
			{#each [1, 2, 3, 4, 5] as s (s)}
				<span class="relative">
					{@render star(fill(s))}
					{#each [s * 2 - 1, s * 2] as half (half)}
						<button
							type="button"
							class="absolute top-0 h-full w-1/2 cursor-pointer {half % 2 ? 'left-0' : 'right-0'}"
							role="radio"
							aria-checked={value === half}
							aria-label={m.rating_label({ stars: String(half / 2) })}
							onmouseenter={() => (hover = half)}
							onfocus={() => (hover = half)}
							onblur={() => (hover = undefined)}
							onclick={() => (value = half)}
						></button>
					{/each}
				</span>
			{/each}
		</span>
		{#if value}
			<button
				type="button"
				class="text-xs text-muted underline"
				onclick={() => (value = undefined)}
			>
				{m.log_rating_clear()}
			</button>
		{/if}
	</span>
{/if}
