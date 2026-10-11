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
		<h2>Meghívólink</h2>
		<p class="muted">
			Ezzel a linkkel bárki csatlakozhat a Google-fiókjával. Ha kiszivárog, cseréld le.
		</p>
		<div class="invite">
			<input class="input" readonly value={data.inviteUrl} aria-label="Meghívólink" />
			<button class="btn btn-small btn-primary" type="button" onclick={copy}
				>{copied ? 'Másolva ✓' : 'Másolás'}</button
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
				<span class="muted small">A régi link azonnal megszűnik.</span>
				<button class="btn btn-small" type="submit">Csere most</button>
			</form>
		{:else}
			<button class="btn btn-small btn-ghost" type="button" onclick={() => (confirmRotate = true)}
				>Link cseréje…</button
			>
		{/if}
	</section>

	<section class="card block">
		<h2>Tagok</h2>
		<ul class="members">
			{#each data.members as m (m.id)}
				<li class:removed={m.removed}>
					<Avatar seed={m.avatarSeed} name={m.nickname} size={32} dim={m.removed} />
					<div class="who">
						<strong>{m.nickname}</strong>
						<span class="faint small"
							>{m.email} · csatlakozott: {formatDate(m.joined)} · utolsó művelet: {m.lastAction
								? timeAgo(m.lastAction)
								: 'még semmi'}{m.removed ? ' · eltávolítva' : ''}</span
						>
					</div>
					{#if !m.me && !m.removed}
						{#if confirmRemove === m.id}
							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="userId" value={m.id} />
								<button class="btn btn-small danger" type="submit">Eltávolítás</button>
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
			Az eltávolított tagok ki lesznek léptetve, a szavazatuk nem számít, a hozzászólásaik „volt
			tag” néven látszanak. A meghívólinkkel visszatérhetnek.
		</p>
	</section>

	<section class="card block">
		<h2>Plex &amp; Radarr</h2>
		<p class="muted">
			{data.availabilityCount} ismert film.
			{#if data.sync}
				Utolsó szinkron: {timeAgo(data.sync.at)}{data.sync.error ? ' — sikertelen' : ''}.
			{:else}
				Indulás óta nem volt szinkron.
			{/if}
		</p>
		{#if data.sync?.error}<p class="error-text small">{data.sync.error}</p>{/if}
		<form method="POST" action="?/sync" use:enhance>
			<button class="btn btn-small" type="submit">Szinkron most</button>
		</form>
		{#if !data.tmdb}<p class="error-text small">
				Nincs beállítva TMDB token, így a keresés nem működik.
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
