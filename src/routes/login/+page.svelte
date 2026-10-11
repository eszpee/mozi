<script lang="ts">
	import Splash from '#lib/components/Splash.svelte';
	import GoogleButton from '#lib/components/GoogleButton.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Belépés · mozi</title></svelte:head>

<Splash>
	<p class="muted">Mit nézzünk legközelebb?</p>
	{#if data.message}<p class="error-text" role="alert">{data.message}</p>{/if}
	<GoogleButton />
	{#if data.devLogin}
		<form method="GET" action="/dev/login" class="dev">
			<label for="as" class="faint small">Csak fejlesztői szerveren: belépés mint</label>
			<div class="row">
				<input id="as" name="as" class="input" placeholder="név" required maxlength="20" />
				<button class="btn" type="submit">Mehet</button>
			</div>
		</form>
	{/if}
	<p class="faint small">Csak tagoknak. Új vagy? Nyisd meg a meghívólinket, amit kaptál.</p>
</Splash>

<style>
	.small {
		font-size: 13px;
		margin: 0;
	}

	p {
		margin: 0;
	}

	.dev {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 12px;
		border-top: 1px dashed var(--line-strong);
		text-align: left;
	}

	.row {
		display: flex;
		gap: 8px;
	}
</style>
