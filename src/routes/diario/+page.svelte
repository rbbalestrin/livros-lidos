<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { api } from '#convex/_generated/api.js';
	import type { Id } from '#convex/_generated/dataModel.js';
	import BookCover from '#lib/components/BookCover.svelte';
	import StarRating from '#lib/components/StarRating.svelte';
	import { href } from '#lib/href.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	const auth = useAuth();
	const client = useConvexClient();
	const diary = useQuery(api.diary.mine, {});

	type Entry = NonNullable<typeof diary.data>[number];

	const months = $derived.by(() => {
		const groups: { month: string; entries: Entry[] }[] = [];
		for (const entry of diary.data ?? []) {
			const month = entry.finishedOn.slice(0, 7);
			const last = groups.at(-1);
			if (last?.month === month) last.entries.push(entry);
			else groups.push({ month, entries: [entry] });
		}
		return groups;
	});

	const monthLabel = (month: string) =>
		new Date(`${month}-15T12:00:00`).toLocaleDateString(getLocale(), {
			month: 'long',
			year: 'numeric'
		});

	async function remove(readingId: Id<'readings'>) {
		if (!confirm(m.diary_delete_confirm())) return;
		await client.mutation(api.diary.remove, { readingId });
	}
</script>

<section class="py-8">
	<h1 class="text-3xl font-semibold">{m.diary_title()}</h1>

	{#if !auth.isLoading && !auth.isAuthenticated}
		<p class="mt-6">
			<a class="text-accent underline" href={href('/entrar')}>{m.log_sign_in_first()}</a>
		</p>
	{:else if diary.data && !diary.data.length}
		<p class="mt-6 max-w-md text-muted">
			{m.diary_empty()}
			<a class="text-accent underline" href={href('/buscar')}>{m.nav_search()}</a>
		</p>
	{/if}

	{#each months as group (group.month)}
		<h2 class="mt-10 mb-3 font-sans text-sm font-semibold tracking-wide text-muted uppercase">
			{monthLabel(group.month)}
		</h2>
		<ol class="divide-y divide-line rounded-xl border border-line bg-card">
			{#each group.entries as entry (entry._id)}
				<li class="flex gap-4 p-4">
					<div class="w-8 shrink-0 pt-1 text-center font-serif text-2xl text-muted">
						{Number(entry.finishedOn.slice(8, 10))}
					</div>
					<BookCover title={entry.book?.title ?? ''} url={entry.book?.coverUrl} width={48} />
					<div class="min-w-0 flex-1">
						<p class="leading-snug font-semibold">{entry.book?.title}</p>
						<p class="text-sm text-muted">{entry.book?.authors.join(', ')}</p>
						<div class="mt-1 flex items-center gap-2">
							{#if entry.rating}<StarRating value={entry.rating} readonly size="sm" />{/if}
							{#if entry.reread}
								<span class="rounded-full bg-line px-2 py-0.5 text-xs text-muted"
									>{m.diary_reread()}</span
								>
							{/if}
						</div>
						{#if entry.review}
							<p class="mt-2 text-sm whitespace-pre-line">{entry.review}</p>
						{/if}
					</div>
					<button
						type="button"
						class="btn-ghost self-start text-xs"
						onclick={() => remove(entry._id)}
					>
						{m.diary_delete()}
					</button>
				</li>
			{/each}
		</ol>
	{/each}
</section>
