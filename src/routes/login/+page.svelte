<script lang="ts">
	import Splash from '#lib/components/Splash.svelte';
	import GoogleButton from '#lib/components/GoogleButton.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Sign in · mozi</title></svelte:head>

<Splash>
	<p class="muted">What are we watching next?</p>
	{#if data.message}<p class="error-text" role="alert">{data.message}</p>{/if}
	<GoogleButton />
	<p class="faint small">Members only. New here? Open the invite link you got from the group.</p>
</Splash>

<style>
	.small {
		font-size: 13px;
		margin: 0;
	}

	p {
		margin: 0;
	}
</style>
