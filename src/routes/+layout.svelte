<script lang="ts">
	import { PUBLIC_CONVEX_URL } from '$app/env/public';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { createSvelteAuthClient, useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '#lib/auth-client.js';
	import { href } from '#lib/href.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import favicon from '#lib/assets/favicon.svg';
	import './layout.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	createSvelteAuthClient({ authClient, convexUrl: PUBLIC_CONVEX_URL });
	const auth = useAuth();

	const otherLocale = $derived(getLocale() === 'en' ? 'pt-br' : 'en');

	async function signOut() {
		await authClient.signOut();
		await goto(href('/'));
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{m.app_name()}</title>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-3xl flex-col px-5">
	<header class="flex items-center justify-between gap-4 py-5">
		<a href={href('/')} class="font-serif text-xl font-semibold tracking-tight">{m.app_name()}</a>
		<nav class="flex items-center gap-1">
			<a href={href('/buscar')} class="btn-ghost">{m.nav_search()}</a>
			{#if auth.isAuthenticated}
				<a href={href('/diario')} class="btn-ghost">{m.nav_diary()}</a>
				<button type="button" class="btn-ghost" onclick={signOut}>{m.nav_sign_out()}</button>
			{:else if !auth.isLoading}
				<a href={href('/entrar')} class="btn-ghost">{m.nav_sign_in()}</a>
			{/if}
			<a
				href={href(page.url.pathname, { locale: otherLocale })}
				class="btn-ghost"
				data-sveltekit-reload
				hreflang={otherLocale}>{m.language_switch()}</a
			>
		</nav>
	</header>

	<main class="flex-1 pb-16">
		{@render children()}
	</main>
</div>
