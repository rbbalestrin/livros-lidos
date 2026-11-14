<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { api } from '#convex/_generated/api.js';
	import type { Doc, Id } from '#convex/_generated/dataModel.js';
	import BookCover from '#lib/components/BookCover.svelte';
	import LogReadingForm from '#lib/components/LogReadingForm.svelte';
	import { href } from '#lib/href.js';
	import { m } from '#lib/paraglide/messages.js';

	const client = useConvexClient();
	const auth = useAuth();

	let query = $state('');
	let lastQuery = $state('');
	let results = $state<Doc<'books'>[]>([]);
	let searching = $state(false);
	let error = $state<string | undefined>();
	let logging = $state<Id<'books'> | undefined>();

	const sourceLabel: Record<string, string> = {
		openLibrary: 'Open Library',
		brasilApi: 'BrasilAPI',
		googleBooks: 'Google Books'
	};

	async function search(event: SubmitEvent) {
		event.preventDefault();
		if (query.trim().length < 2) return;
		searching = true;
		error = undefined;
		logging = undefined;
		try {
			results = await client.action(api.catalog.search, { query });
			lastQuery = query;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			searching = false;
		}
	}
</script>

<section class="py-8">
	<h1 class="text-3xl font-semibold">{m.search_title()}</h1>
	<form class="mt-5 flex gap-2" onsubmit={search}>
		<input
			class="field"
			type="search"
			name="q"
			placeholder={m.search_placeholder()}
			aria-label={m.search_placeholder()}
			bind:value={query}
		/>
		<button class="btn" disabled={searching}>
			{searching ? m.search_searching() : m.search_button()}
		</button>
	</form>

	{#if error}<p class="mt-4 text-sm text-red-700">{m.auth_error({ message: error })}</p>{/if}

	{#if !searching && lastQuery && !results.length}
		<p class="mt-8 text-muted">{m.search_empty({ query: lastQuery })}</p>
	{/if}

	<ul class="mt-8 space-y-4">
		{#each results as book (book._id)}
			<li class="rounded-xl border border-line bg-card p-4">
				<div class="flex gap-4">
					<BookCover title={book.title} url={book.coverUrl} />
					<div class="min-w-0 flex-1">
						<h2 class="text-lg leading-snug font-semibold">
							{book.title}{#if book.subtitle}<span class="font-normal text-muted"
									>: {book.subtitle}</span
								>{/if}
						</h2>
						{#if book.authors.length}<p class="text-sm">{book.authors.join(', ')}</p>{/if}
						<p class="mt-1 text-sm text-muted">
							{[
								book.year,
								book.publisher,
								book.pages && m.book_pages({ count: String(book.pages) })
							]
								.filter(Boolean)
								.join(' · ')}
						</p>
						<p class="mt-1 text-xs text-muted/80">
							{m.search_sources({
								sources: Object.keys(book.sourceIds)
									.map((s) => sourceLabel[s] ?? s)
									.join(', ')
							})}{#if book.isbn13}&nbsp;· ISBN {book.isbn13}{/if}
						</p>
						{#if logging !== book._id}
							{#if auth.isAuthenticated}
								<button type="button" class="mt-3 btn" onclick={() => (logging = book._id)}>
									{m.log_open()}
								</button>
							{:else}
								<a class="mt-3 inline-block text-sm text-accent underline" href={href('/entrar')}>
									{m.log_sign_in_first()}
								</a>
							{/if}
						{/if}
					</div>
				</div>
				{#if logging === book._id}
					<LogReadingForm bookId={book._id} oncancel={() => (logging = undefined)} />
				{/if}
			</li>
		{/each}
	</ul>
</section>
