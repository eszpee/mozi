<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Splash from '#lib/components/Splash.svelte';
	import Avatar from '#lib/components/Avatar.svelte';

	let { data, form } = $props();

	// Both are drafts until saved: a new avatar is only a preview, so leaving the
	// page keeps the old one.
	let nickname = $state(untrack(() => data.nickname));
	let seed = $state(untrack(() => data.avatarSeed));

	/** A random seed in the same shape as the server's (base64url). */
	function reroll() {
		const bytes = crypto.getRandomValues(new Uint8Array(9));
		seed = btoa(String.fromCharCode(...bytes))
			.replaceAll('+', '-')
			.replaceAll('/', '_');
	}
</script>

<svelte:head><title>Üdv · mozi</title></svelte:head>

<Splash>
	<h1>{data.firstTime ? 'Üdv!' : 'Te'}</h1>
	<div class="avatar-row">
		<Avatar {seed} size={96} />
		<button class="btn btn-small" type="button" onclick={reroll}>🎲 Másik avatár</button>
	</div>
	<form
		method="POST"
		action="?/save"
		class="name"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
	>
		<input type="hidden" name="avatarSeed" value={seed} />
		<label for="nickname" class="muted">Hogy szólítson a csapat?</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="nickname"
			name="nickname"
			class="input"
			maxlength="24"
			required
			autocomplete="nickname"
			autofocus={data.firstTime}
			bind:value={nickname}
		/>
		{#if form && 'error' in form}<p class="error-text" role="alert">{form.error}</p>{/if}
		<button class="btn btn-primary" type="submit">{data.firstTime ? 'Mehet' : 'Mentés'}</button>
		{#if !data.firstTime}<a class="btn btn-ghost" href="/">Mégse</a>{/if}
	</form>
</Splash>

<style>
	h1 {
		margin: 0;
	}

	.avatar-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.name {
		display: flex;
		flex-direction: column;
		gap: 10px;
		text-align: left;
	}

	.error-text {
		margin: 0;
	}
</style>
