<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { api } from '#convex/_generated/api.js';
	import BookCover from '#lib/components/BookCover.svelte';
	import StarRating from '#lib/components/StarRating.svelte';
	import { groupByMonth, localDate } from '#lib/diary.js';
	import { href } from '#lib/href.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	const auth = useAuth();
	const client = useConvexClient();
	const diary = useQuery(api.diary.mine, {});

	type Entry = NonNullable<typeof diary.data>[number];

	const months = $derived(groupByMonth(diary.data ?? []));
	const currentYear = new Date().getFullYear();

	const monthLabel = (month: string, year: number) =>
		localDate(`${month}-01`).toLocaleDateString(getLocale(), {
			month: 'long',
			year: year === currentYear ? undefined : 'numeric'
		});
	const weekday = (day: string, style: 'long' | 'short') =>
		localDate(day).toLocaleDateString(getLocale(), { weekday: style });
	const dayOfMonth = (day: string) => Number(day.slice(8, 10));

	async function remove(entry: Entry) {
		if (!confirm(m.diary_delete_confirm())) return;
		await client.mutation(api.diary.remove, { readingId: entry._id });
	}
</script>

{#snippet deleteButton(entry: Entry)}
	<button
		type="button"
		class="btn-ghost shrink-0 px-2 py-1 text-xs opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
		aria-label={m.diary_delete_label({ title: entry.book?.title ?? '' })}
		onclick={() => remove(entry)}
	>
		{m.diary_delete()}
	</button>
{/snippet}

{#snippet bookLine(entry: Entry, compact: boolean)}
	{@const title = entry.book?.title ?? ''}
	{@const authors = entry.book?.authors.join(', ')}
	<div class="flex items-center gap-3">
		<BookCover {title} url={entry.book?.coverUrl} width={compact ? 20 : 28} />
		<!-- Compact entries keep to one line from `sm` up; on a phone the meta drops below the title. -->
		<div
			class="flex min-w-0 flex-1 flex-col gap-0.5 text-sm leading-snug {compact
				? 'sm:flex-row sm:items-center sm:gap-3'
				: ''}"
		>
			<p
				class="line-clamp-2 min-w-0 wrap-break-word {compact ? 'sm:line-clamp-1 sm:flex-1' : ''}"
				title={authors ? `${title} · ${authors}` : title}
			>
				<span class="font-semibold">{title}</span>
				{#if authors}<span class="text-muted"> · {authors}</span>{/if}
			</p>
			{#if entry.rating || entry.reread}
				<div class="flex shrink-0 items-center gap-2">
					{#if entry.rating}<StarRating value={entry.rating} readonly size="sm" />{/if}
					{#if entry.reread}
						<span
							class="rounded-full border border-accent/30 px-2 font-serif text-xs text-accent italic"
							>{m.diary_reread()}</span
						>
					{/if}
				</div>
			{/if}
		</div>
		{@render deleteButton(entry)}
	</div>
{/snippet}

<section class="py-8">
	<header
		class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/80 pb-3"
	>
		<h1 class="text-3xl font-semibold">{m.diary_title()}</h1>
		{#if diary.data?.length}
			<p class="font-serif text-muted italic">{m.diary_count({ count: diary.data.length })}</p>
		{/if}
	</header>

	{#if !auth.isLoading && !auth.isAuthenticated}
		<p class="mt-6">
			<a class="text-accent underline" href={href('/entrar')}>{m.log_sign_in_first()}</a>
		</p>
	{:else if diary.data && !diary.data.length}
		<p class="mt-6 max-w-md text-muted">
			{m.diary_empty()}
			<a class="text-accent underline" href={href('/buscar')}>{m.nav_search()}</a>
		</p>
	{:else if months.length}
		<div class="notebook relative mt-2 rounded-b-xl bg-card [--margin:4.5rem] sm:[--margin:8.5rem]">
			<!-- the red margin rule of a school notebook -->
			<div
				class="pointer-events-none absolute inset-y-0 left-[calc(var(--margin)-1px)] w-px bg-accent/40"
			></div>

			{#each months as group (group.month)}
				<h2
					class="sticky top-0 z-10 grid grid-cols-[var(--margin)_minmax(0,1fr)] bg-card/95 backdrop-blur-sm"
				>
					<span class="border-r border-accent/40"></span>
					<span
						class="pt-8 pb-2 pl-4 font-serif text-sm tracking-[0.2em] text-accent uppercase sm:pl-8"
					>
						{monthLabel(group.month, group.year)}
					</span>
				</h2>

				<ol>
					{#each group.entries as entry (entry._id)}
						{#if entry.review}
							<li class="group grid grid-cols-[var(--margin)_minmax(0,1fr)] py-6">
								<time datetime={entry.finishedOn} class="pr-3 text-right sm:pr-6">
									<span
										class="block font-serif text-4xl leading-none font-semibold text-ink/85 tabular-nums sm:text-6xl"
										>{dayOfMonth(entry.finishedOn)}</span
									>
									<span class="mt-1 block text-xs tracking-wide text-muted">
										<span class="sm:hidden">{weekday(entry.finishedOn, 'short')}</span>
										<span class="hidden sm:inline">{weekday(entry.finishedOn, 'long')}</span>
									</span>
								</time>
								<div class="pr-1 pl-4 sm:pr-6 sm:pl-8">
									<blockquote
										class="font-serif leading-[1.45] [text-wrap:pretty] wrap-break-word whitespace-pre-line text-ink {entry
											.review.length > 280
											? 'text-lg sm:text-xl'
											: 'text-xl sm:text-[1.55rem]'}"
									>
										<span class="text-accent/70" aria-hidden="true">“</span>{entry.review}<span
											class="text-accent/70"
											aria-hidden="true">”</span
										>
									</blockquote>
									<div class="mt-4">{@render bookLine(entry, false)}</div>
								</div>
							</li>
						{:else}
							<li class="group grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center py-2.5">
								<time
									datetime={entry.finishedOn}
									class="flex items-baseline justify-end gap-1.5 pr-3 sm:pr-6"
								>
									<span class="text-xs text-muted">{weekday(entry.finishedOn, 'short')}</span>
									<span
										class="font-serif text-2xl leading-none font-semibold text-ink/85 tabular-nums"
										>{dayOfMonth(entry.finishedOn)}</span
									>
								</time>
								<div class="pr-1 pl-4 sm:pr-6 sm:pl-8">{@render bookLine(entry, true)}</div>
							</li>
						{/if}
					{/each}
				</ol>
			{/each}
			<div class="h-10"></div>
		</div>
	{/if}
</section>

<style>
	/* faint ruled lines, like notebook paper */
	.notebook {
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0,
			transparent 31px,
			color-mix(in oklab, var(--color-line) 55%, transparent) 31px,
			color-mix(in oklab, var(--color-line) 55%, transparent) 32px
		);
		box-shadow:
			0 1px 0 var(--color-line),
			0 12px 30px -18px color-mix(in oklab, var(--color-ink) 35%, transparent);
	}
</style>
