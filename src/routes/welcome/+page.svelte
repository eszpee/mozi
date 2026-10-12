<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Splash from '#lib/components/Splash.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import { rerollSeed } from '#lib/avatar.ts';

	let { data, form } = $props();

	// Both are drafts until saved: a new avatar is only a preview, so leaving the
	// page keeps the old one.
	let nickname = $state(untrack(() => data.nickname));
	let seed = $state(untrack(() => data.avatarSeed));
</script>

<svelte:head><title>Üdv · mozi</title></svelte:head>

<Splash>
	<h1>{data.firstTime ? 'Üdv!' : 'Te'}</h1>
	<div class="avatar-row">
		<Avatar {seed} size={96} />
		<!-- One pill, split by the die: the left half changes the picture, the right the color. -->
		<div class="reroll" role="group" aria-label="Új avatar">
			<button type="button" onclick={() => (seed = rerollSeed(seed, 'emoji'))}>Új kép</button>
			<span class="die" aria-hidden="true">🎲</span>
			<button type="button" onclick={() => (seed = rerollSeed(seed, 'color'))}>Új szín</button>
		</div>
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
		<label for="nickname" class="muted">Hogy hívnak?</label>
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

	.reroll {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		background: var(--surface);
		overflow: hidden;
	}

	.reroll button {
		min-height: 38px;
		padding: 0 26px 0 18px;
		border: 0;
		background: none;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.reroll button:last-child {
		padding: 0 18px 0 26px;
		border-left: 1px solid var(--line-strong);
	}

	.reroll button:hover {
		background: var(--surface-hover);
	}

	.reroll button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
		border-radius: 999px;
	}

	/* Sits on the seam between the halves; clicks pass through to the buttons. */
	.die {
		position: absolute;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid var(--line-strong);
		background: var(--bg-raised);
		font-size: 14px;
		pointer-events: none;
		transition: rotate 0.3s;
	}

	.reroll:has(button:first-child:active) .die {
		rotate: -90deg;
	}

	.reroll:has(button:last-child:active) .die {
		rotate: 90deg;
	}

	@media (prefers-reduced-motion: reduce) {
		.die {
			transition: none;
		}
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
