<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import Poster from '#lib/components/Poster.svelte';
	import AvailabilityBadge from '#lib/components/AvailabilityBadge.svelte';
	import type { SearchHit } from '#lib/server/search.ts';

	let { data, form } = $props();

	// svelte-ignore state_referenced_locally
	let query = $state(data.q);
	// svelte-ignore state_referenced_locally
	let hits: SearchHit[] = $state(data.hits);
	// svelte-ignore state_referenced_locally
	let error: string | null = $state(data.error);
	let loading = $state(false);
	let adding: number | null = $state(null);

	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | undefined;

	function onInput() {
		clearTimeout(timer);
		timer = setTimeout(runSearch, 250);
	}

	async function runSearch() {
		const q = query.trim();
		controller?.abort();
		if (q.length < 2) {
			hits = [];
			error = null;
			return;
		}
		controller = new AbortController();
		loading = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
				signal: controller.signal
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error);
			hits = body;
			error = null;
			history.replaceState(history.state, '', `?q=${encodeURIComponent(q)}`);
		} catch (e) {
			if ((e as Error).name !== 'AbortError') error = 'A keresés most nem elérhető';
		} finally {
			loading = false;
		}
	}

	// Text typed before hydration never fired `input`; search for it now.
	onMount(() => {
		if (query.trim() !== data.q.trim()) runSearch();
	});

	onDestroy(() => clearTimeout(timer));
</script>

<svelte:head><title>Ajánlás · mozi</title></svelte:head>

<div class="wrap page">
	<h1>Film ajánlása</h1>
	<form
		method="GET"
		class="search"
		role="search"
		onsubmit={(e) => (e.preventDefault(), runSearch())}
	>
		<label for="q" class="sr-only">Film címe</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="q"
			name="q"
			class="input"
			type="search"
			placeholder="Keresés cím alapján…"
			autocomplete="off"
			autofocus
			bind:value={query}
			oninput={onInput}
		/>
		{#if loading}<span class="spinner" aria-label="Keresés…"></span>{/if}
	</form>

	{#if form?.error}<p class="error-text" role="alert">{form.error}</p>{/if}
	{#if error}<p class="error-text" role="alert">{error}</p>{/if}

	{#if hits.length}
		<ul class="hits">
			{#each hits as hit (hit.tmdbId)}
				<li class="hit">
					<div class="thumb">
						<Poster path={hit.posterPath} title={hit.title.main} sizes="64px" />
					</div>
					<div class="info">
						<p class="title">
							{hit.title.main}
							{#if hit.year}<span class="year">{hit.year}</span>{/if}
						</p>
						{#if hit.title.original}<p class="original">{hit.title.original}</p>{/if}
						<AvailabilityBadge status={hit.availability} variant="inline" />
					</div>
					<div class="action">
						{#if hit.watched}
							<a class="btn btn-small btn-ghost" href="/movie/{hit.listedId}">Megnéztük ✓</a>
						{:else}
							<form
								method="POST"
								action="?/recommend"
								use:enhance={() => {
									adding = hit.tmdbId;
									return async ({ update }) => {
										await update();
										adding = null;
									};
								}}
							>
								<input type="hidden" name="tmdbId" value={hit.tmdbId} />
								<button
									class="btn btn-small {hit.listedId ? '' : 'btn-primary'}"
									type="submit"
									disabled={adding !== null}
								>
									{#if adding === hit.tmdbId}Hozzáadás…{:else if hit.listedId}Listán · 👍{:else}＋
										Hozzáad{/if}
								</button>
							</form>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else if query.trim().length >= 2 && !loading && !error}
		<p class="muted">Nincs ilyen film.</p>
	{:else if !query}
		<p class="faint">
			Ha hozzáadsz egy filmet, az a te 👍-od is. Ha már a listán van, csak a szavazatod adódik
			hozzá.
		</p>
	{/if}

	<p class="attribution">
		A filmadatok és plakátok forrása: <a
			href="https://www.themoviedb.org/"
			target="_blank"
			rel="noopener noreferrer">TMDB</a
		>. Ez az oldal a TMDB API-t használja, de a TMDB nem támogatja és nem tanúsítja.
	</p>
</div>

<style>
	.attribution {
		margin-top: 24px;
		font-size: 11.5px;
		color: var(--text-faint);
	}

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

	.search {
		position: relative;
	}

	.search .input {
		font-size: 17px;
		min-height: 52px;
		padding-right: 44px;
	}

	.spinner {
		position: absolute;
		right: 16px;
		top: 50%;
		width: 18px;
		height: 18px;
		margin-top: -9px;
		border: 2px solid var(--line-strong);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.hits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.hit {
		display: grid;
		grid-template-columns: 52px 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 8px;
		border-radius: var(--radius);
	}

	.hit:hover {
		background: var(--bg-raised);
	}

	.thumb :global(.poster) {
		border-radius: 6px;
	}

	.thumb :global(.placeholder span) {
		font-size: 0;
	}

	.info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: flex-start;
	}

	.title {
		margin: 0;
		font-weight: 650;
	}

	.year {
		color: var(--text-faint);
		font-weight: 450;
		margin-left: 4px;
	}

	.original {
		margin: 0;
		font-size: 13px;
		color: var(--text-muted);
		font-style: italic;
	}

	p {
		margin: 0;
	}
</style>
