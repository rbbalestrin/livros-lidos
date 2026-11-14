<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '#lib/auth-client.js';
	import { href } from '#lib/href.js';
	import { m } from '#lib/paraglide/messages.js';

	let mode = $state<'signIn' | 'signUp'>('signIn');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let error = $state<string | undefined>();

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		error = undefined;
		const result =
			mode === 'signUp'
				? await authClient.signUp.email({ name, email, password })
				: await authClient.signIn.email({ email, password });
		busy = false;
		if (result.error) {
			error = result.error.message ?? result.error.statusText;
			return;
		}
		await goto(href('/diario'));
	}
</script>

<section class="mx-auto max-w-sm py-12">
	<h1 class="text-3xl font-semibold">
		{mode === 'signUp' ? m.auth_sign_up_title() : m.auth_sign_in_title()}
	</h1>
	<form class="mt-6 space-y-4" onsubmit={submit}>
		{#if mode === 'signUp'}
			<label class="block text-sm">
				<span class="mb-1 block text-muted">{m.auth_name()}</span>
				<input class="field" autocomplete="name" required bind:value={name} />
			</label>
		{/if}
		<label class="block text-sm">
			<span class="mb-1 block text-muted">{m.auth_email()}</span>
			<input class="field" type="email" autocomplete="email" required bind:value={email} />
		</label>
		<label class="block text-sm">
			<span class="mb-1 block text-muted">{m.auth_password()}</span>
			<input
				class="field"
				type="password"
				minlength="8"
				autocomplete={mode === 'signUp' ? 'new-password' : 'current-password'}
				required
				bind:value={password}
			/>
		</label>
		{#if error}<p class="text-sm text-red-700">{m.auth_error({ message: error })}</p>{/if}
		<button class="btn w-full" disabled={busy}>
			{mode === 'signUp' ? m.auth_sign_up() : m.auth_sign_in()}
		</button>
	</form>
	<button
		type="button"
		class="mt-4 text-sm text-accent underline"
		onclick={() => {
			mode = mode === 'signUp' ? 'signIn' : 'signUp';
			error = undefined;
		}}
	>
		{mode === 'signUp' ? m.auth_switch_to_sign_in() : m.auth_switch_to_sign_up()}
	</button>
</section>
