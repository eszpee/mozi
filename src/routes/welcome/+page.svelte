<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Splash from '#lib/components/Splash.svelte';
	import Avatar from '#lib/components/Avatar.svelte';

	let { data, form } = $props();

	let seed = $derived((form && 'avatarSeed' in form && form.avatarSeed) || data.avatarSeed);
	// Local state, so rerolling the avatar (a separate form) keeps what was typed.
	let nickname = $state(untrack(() => data.nickname));
</script>

<svelte:head><title>Üdv · mozi</title></svelte:head>

<Splash>
	<h1>{data.firstTime ? 'Üdv!' : 'Te'}</h1>
	<form method="POST" action="?/reroll" use:enhance class="avatar-row">
		<Avatar {seed} size={96} />
		<button class="btn btn-small" type="submit">🎲 Másik avatár</button>
	</form>
	<form method="POST" action="?/save" class="name">
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
