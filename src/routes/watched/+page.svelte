<script lang="ts">
	import { enhance } from '$app/forms';
	import Poster from '#lib/components/Poster.svelte';
	import { formatDate, formatNightDate } from '#lib/ui.ts';

	let { data } = $props();
	let confirmUndo: number | null = $state(null);
</script>

<svelte:head><title>Watched · mozi</title></svelte:head>

<div class="wrap page">
	<h1>Watched together</h1>
	{#if data.movies.length}
		<ul class="list">
			{#each data.movies as m (m.id)}
				<li class="item">
					<a class="thumb" href="/movie/{m.id}">
						<Poster path={m.posterPath} title={m.title.main} sizes="72px" />
					</a>
					<div class="info">
						<a class="title" href="/movie/{m.id}">{m.title.main}</a>
						{#if m.title.original}<p class="original">{m.title.original}</p>{/if}
						<p class="when">
							{[m.nightLabel, formatNightDate(m.nightDate) ?? formatDate(m.watchedAt!)]
								.filter(Boolean)
								.join(' · ')}
						</p>
						<p class="tally">👍 {m.tally.up} · 🤷 {m.tally.meh} · 👎 {m.tally.down}</p>
					</div>
					<div class="undo">
						{#if confirmUndo === m.id}
							<form method="POST" action="?/undo" use:enhance>
								<input type="hidden" name="movieId" value={m.id} />
								<button class="btn btn-small" type="submit">Undo</button>
							</form>
						{:else}
							<button
								class="btn btn-small btn-ghost"
								type="button"
								onclick={() => (confirmUndo = m.id)}
							>
								⋯
							</button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty card">
			<p class="muted">
				Nothing watched yet. When the group watches a pick, open it and tap “We watched it”.
			</p>
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-top: 20px;
		max-width: 760px;
	}

	h1 {
		font-size: 26px;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.item {
		display: grid;
		grid-template-columns: 64px 1fr auto;
		gap: 14px;
		align-items: center;
		padding: 10px;
		border-radius: var(--radius);
		background: var(--bg-raised);
		border: 1px solid var(--line);
	}

	.thumb :global(.placeholder span) {
		font-size: 0;
	}

	.thumb :global(.poster) {
		border-radius: 8px;
	}

	.info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.title {
		font-weight: 650;
		text-decoration: none;
		font-size: 16px;
	}

	p {
		margin: 0;
		font-size: 13px;
	}

	.original {
		font-style: italic;
		color: var(--text-muted);
	}

	.when {
		color: var(--accent);
	}

	.tally {
		color: var(--text-faint);
	}

	.empty {
		padding: 32px 24px;
		text-align: center;
	}
</style>
