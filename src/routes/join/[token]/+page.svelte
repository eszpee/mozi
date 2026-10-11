<script lang="ts">
	import Splash from '#lib/components/Splash.svelte';
	import GoogleButton from '#lib/components/GoogleButton.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Csatlakozás · mozi</title></svelte:head>

<Splash>
	{#if data.valid}
		<h1>Meghívtak 🍿</h1>
		<p class="muted">
			Lépj be Google-fiókkal, és csatlakozz a mozis csapathoz. Eszközönként csak egyszer kell.
		</p>
		<GoogleButton />
	{:else}
		<h1>Lejárt link</h1>
		<p class="muted">Ez a meghívólink már nem érvényes. Kérj egy újat.</p>
	{/if}
</Splash>

<style>
	p,
	h1 {
		margin: 0;
	}
</style>
