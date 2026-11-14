<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '#convex/_generated/api.js';
	import type { Id } from '#convex/_generated/dataModel.js';
	import { href } from '#lib/href.js';
	import { m } from '#lib/paraglide/messages.js';
	import StarRating from './StarRating.svelte';

	let { bookId, oncancel }: { bookId: Id<'books'>; oncancel: () => void } = $props();

	const client = useConvexClient();

	const today = () => {
		const now = new Date();
		return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
	};

	let finishedOn = $state(today());
	let rating = $state<number | undefined>();
	let review = $state('');
	let reread = $state(false);
	let saving = $state(false);
	let saved = $state(false);
	let error = $state<string | undefined>();

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		error = undefined;
		try {
			await client.mutation(api.diary.log, {
				bookId,
				finishedOn,
				rating,
				review: review.trim() || undefined,
				reread
			});
			saved = true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

{#if saved}
	<p class="mt-3 text-sm">
		{m.log_saved()}
		<a class="text-accent underline" href={href('/diario')}>{m.nav_diary()}</a>
	</p>
{:else}
	<form class="mt-4 space-y-4 rounded-lg border border-line bg-paper/60 p-4" onsubmit={save}>
		<div class="flex flex-wrap items-end gap-6">
			<label class="block text-sm">
				<span class="mb-1 block text-muted">{m.log_finished_on()}</span>
				<input class="field w-auto" type="date" required max={today()} bind:value={finishedOn} />
			</label>
			<div class="text-sm">
				<span class="mb-1 block text-muted">{m.log_rating()}</span>
				<StarRating bind:value={rating} />
			</div>
		</div>
		<label class="block text-sm">
			<span class="mb-1 block text-muted">{m.log_review()}</span>
			<textarea class="min-h-24 field" maxlength="10000" bind:value={review}></textarea>
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" class="accent-accent" bind:checked={reread} />
			{m.log_reread()}
		</label>
		{#if error}<p class="text-sm text-red-700">{m.auth_error({ message: error })}</p>{/if}
		<div class="flex gap-2">
			<button class="btn" disabled={saving}>{m.log_save()}</button>
			<button type="button" class="btn-ghost" onclick={oncancel}>{m.log_cancel()}</button>
		</div>
	</form>
{/if}
