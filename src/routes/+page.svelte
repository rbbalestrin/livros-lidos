<script lang="ts">
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { href } from '#lib/href.js';
	import { m } from '#lib/paraglide/messages.js';

	const auth = useAuth();
</script>

<section class="py-16 sm:py-24">
	<h1 class="max-w-xl text-4xl leading-tight font-semibold sm:text-5xl">{m.home_title()}</h1>
	<p class="mt-5 max-w-lg text-lg text-muted">{m.home_body()}</p>
	<div class="mt-8">
		{#if auth.isAuthenticated}
			<a class="btn" href={href('/buscar')}>{m.home_cta_signed_in()}</a>
		{:else}
			<a class="btn" href={href('/entrar')}>{m.home_cta()}</a>
		{/if}
	</div>
</section>
