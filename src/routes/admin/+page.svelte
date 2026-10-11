<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import { formatDate, timeAgo } from '#lib/ui.ts';

	let { data } = $props();
	let copied = $state(false);
	let confirmRotate = $state(false);
	let confirmRemove: number | null = $state(null);

	async function copy() {
		await navigator.clipboard.writeText(data.inviteUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head><title>Admin · mozi</title></svelte:head>

<div class="wrap page">
	<h1>Admin</h1>

	<section class="card block">
		<h2>Invite link</h2>
		<p class="muted">
			Anyone with this link can join with their Google account. Rotate it if it leaks.
		</p>
		<div class="invite">
			<input class="input" readonly value={data.inviteUrl} aria-label="Invite link" />
			<button class="btn btn-small btn-primary" type="button" onclick={copy}
				>{copied ? 'Copied ✓' : 'Copy'}</button
			>
		</div>
		{#if confirmRotate}
			<form
				method="POST"
				action="?/rotate"
				use:enhance={() =>
					async ({ update }) => {
						await update();
						confirmRotate = false;
					}}
				class="row"
			>
				<span class="muted small">The old link stops working immediately.</span>
				<button class="btn btn-small" type="submit">Rotate now</button>
			</form>
		{:else}
			<button class="btn btn-small btn-ghost" type="button" onclick={() => (confirmRotate = true)}
				>Rotate link…</button
			>
		{/if}
	</section>

	<section class="card block">
		<h2>Members</h2>
		<ul class="members">
			{#each data.members as m (m.id)}
				<li class:removed={m.removed}>
					<Avatar seed={m.avatarSeed} name={m.nickname} size={32} dim={m.removed} />
					<div class="who">
						<strong>{m.nickname}</strong>
						<span class="faint small"
							>{m.email} · joined {formatDate(m.joined)}{m.removed ? ' · removed' : ''}</span
						>
					</div>
					{#if !m.me && !m.removed}
						{#if confirmRemove === m.id}
							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="userId" value={m.id} />
								<button class="btn btn-small danger" type="submit">Remove</button>
							</form>
						{:else}
							<button
								class="btn btn-small btn-ghost"
								type="button"
								onclick={() => (confirmRemove = m.id)}>⋯</button
							>
						{/if}
					{/if}
				</li>
			{/each}
		</ul>
		<p class="faint small">
			Removed members are signed out; their votes stop counting and their comments show as “former
			member”. They can rejoin with the invite link.
		</p>
	</section>

	<section class="card block">
		<h2>Plex &amp; Radarr</h2>
		<p class="muted">
			{data.availabilityCount} movies known.
			{#if data.sync}
				Last sync {timeAgo(data.sync.at)}{data.sync.error ? ' — failed' : ''}.
			{:else}
				Not synced since start.
			{/if}
		</p>
		{#if data.sync?.error}<p class="error-text small">{data.sync.error}</p>{/if}
		<form method="POST" action="?/sync" use:enhance>
			<button class="btn btn-small" type="submit">Sync now</button>
		</form>
		{#if !data.tmdb}<p class="error-text small">
				TMDB token is not configured: search won’t work.
			</p>{/if}
	</section>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-top: 20px;
		max-width: 720px;
	}

	h1 {
		font-size: 26px;
	}

	h2 {
		font-size: 18px;
	}

	.block {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: flex-start;
	}

	.block p {
		margin: 0;
	}

	.invite {
		display: flex;
		gap: 8px;
		width: 100%;
		align-items: center;
	}

	.invite .input {
		font-size: 13px;
		min-height: 40px;
	}

	.row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.small {
		font-size: 12.5px;
	}

	.members {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.members li {
		display: grid;
		grid-template-columns: 32px 1fr auto;
		gap: 10px;
		align-items: center;
	}

	.removed {
		opacity: 0.6;
	}

	.who {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.who span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.danger {
		background: var(--down);
		border-color: var(--down);
		color: #2a0610;
	}
</style>
