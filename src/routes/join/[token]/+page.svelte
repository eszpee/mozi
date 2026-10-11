<script lang="ts">
	import Splash from '#lib/components/Splash.svelte';
	import GoogleButton from '#lib/components/GoogleButton.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Join · mozi</title></svelte:head>

<Splash>
	{#if data.valid}
		<h1>You’re invited 🍿</h1>
		<p class="muted">
			Sign in with Google to join the movie-night crew. You only need to do this once per device.
		</p>
		<GoogleButton />
	{:else}
		<h1>Link expired</h1>
		<p class="muted">This invite link isn’t valid anymore. Ask for a fresh one.</p>
	{/if}
</Splash>

<style>
	p,
	h1 {
		margin: 0;
	}
</style>
