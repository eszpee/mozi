<script lang="ts">
	import { page } from '$app/state';
	import MovieCard from '#lib/components/MovieCard.svelte';
	import NightStrip from '#lib/components/NightStrip.svelte';
	import { flip } from 'svelte/animate';
	import { refreshAll } from '$app/navigation';
	import { SORTS, rank, type SortKey } from '#lib/scoring.ts';
	import { stableOrder } from '#lib/stable-order.ts';
	import { onMount } from 'svelte';

	let { data } = $props();

	// The filters live only on this device: kept in localStorage, never in the URL.
	const FILTERS_KEY = 'mozi.filters';
	let filters = $state({
		needsVote: false,
		inPlex: false,
		scope: 'everyone' as 'everyone' | 'night'
	});
	let filtersLoaded = false;

	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? '{}');
			filters = {
				needsVote: saved.needsVote === true,
				inPlex: saved.inPlex === true,
				scope: saved.scope === 'night' ? 'night' : 'everyone'
			};
		} catch {
			// Nothing saved, or storage is blocked: start from the defaults.
		}
		filtersLoaded = true;
	});

	$effect(() => {
		const json = JSON.stringify(filters);
		if (!filtersLoaded) return;
		try {
			localStorage.setItem(FILTERS_KEY, json);
		} catch {
			// Private mode or blocked storage: the filters just don't stick.
		}
	});

	let byNight = $derived(filters.scope === 'night');

	/** The current ranking, filtered — what a fresh page load would show. */
	let fresh = $derived.by(() => {
		let movies = data.movies;
		if (filters.needsVote) movies = movies.filter((m) => m.myVote === null);
		if (filters.inPlex)
			movies = movies.filter(
				(m) =>
					m.availability === 'plex' || m.providers.stream.length > 0 || m.providers.rent.length > 0
			);
		return rank(
			movies.map((m) => ({
				movie: m,
				tally: byNight ? m.nightTally : m.tally,
				addedAt: m.addedAt,
				rating: m.rating,
				seen: byNight ? m.nightSeen : m.seenBy.length,
				released: m.releaseDate ?? (m.year ? String(m.year) : null)
			})),
			data.sort
		).map((r) => r.movie);
	});

	// Votes refresh the data, but cards keep their place until the view changes
	// (sort, scope, filter), the page is loaded again, or the refresh button is tapped.
	let refreshes = $state(0);
	let refreshing = $state(false);
	let viewKey = $derived(
		`${data.sort}|${filters.scope}|${filters.needsVote}|${filters.inPlex}|${refreshes}`
	);

	async function refresh() {
		refreshing = true;
		try {
			await refreshAll();
			refreshes++;
		} finally {
			refreshing = false;
		}
	}
	let memory = { ids: [] as number[], key: '' };
	let order = $derived.by(() => {
		const freshIds = fresh.map((m) => m.id);
		if (memory.key !== viewKey) {
			memory = { ids: freshIds, key: viewKey };
		} else {
			const existing = new Set(data.movies.map((m) => m.id));
			memory = { ...memory, ids: stableOrder(memory.ids, freshIds, existing) };
		}
		return memory.ids;
	});
	let byId = $derived(new Map(data.movies.map((m) => [m.id, m])));
	let shown = $derived(order.map((id) => byId.get(id)!));
	let unvoted = $derived(data.movies.filter((m) => m.myVote === null).length);
	let total = $derived(data.movies.length);

	/** Builds a link to this page with one query parameter changed. */
	function withParam(name: string, value: string | null) {
		const url = new URL(page.url.href);
		if (value === null) url.searchParams.delete(name);
		else url.searchParams.set(name, value);
		return `${url.pathname}${url.search}`;
	}

	// The overall pick | by votes | by the movie itself.
	const SORT_GROUPS: SortKey[][] = [
		['best'],
		['liked', 'hated', 'controversial'],
		['rated', 'released', 'added']
	];
</script>

<svelte:head><title>Filmek · mozi</title></svelte:head>

<div class="wrap page">
	<NightStrip night={data.night} members={data.members} />

	{#if total > 0}
		<div class="controls">
			<div class="row">
				<div class="filters">
					<button
						class="chip"
						type="button"
						aria-pressed={filters.needsVote}
						onclick={() => (filters.needsVote = !filters.needsVote)}
					>
						Amikre még nem szavaztam{#if unvoted}<span class="count">{unvoted}</span>{/if}
					</button>
					<button
						class="chip"
						type="button"
						aria-pressed={filters.inPlex}
						onclick={() => (filters.inPlex = !filters.inPlex)}>▶ Elérhető</button
					>
				</div>
				<div class="segmented" role="group" aria-label="Kinek a szavazata számít">
					<button type="button" aria-pressed={!byNight} onclick={() => (filters.scope = 'everyone')}
						>Mindenki</button
					>
					<button type="button" aria-pressed={byNight} onclick={() => (filters.scope = 'night')}
						>Csak az számít, aki jön</button
					>
				</div>
			</div>
			<div class="sort-row">
				<nav class="sorts" aria-label="Rendezés">
					{#each SORT_GROUPS as group, g (g)}
						{#if g > 0}<span class="sep" aria-hidden="true"></span>{/if}
						{#each group as key (key)}
							<a
								href={withParam('sort', key === 'best' ? null : key)}
								aria-current={data.sort === key ? 'true' : undefined}
								data-sveltekit-reset="false"
								data-sveltekit-replacestate>{SORTS[key]}</a
							>
						{/each}
					{/each}
				</nav>
				<button
					class="refresh"
					class:spin={refreshing}
					type="button"
					onclick={refresh}
					aria-label="Frissítés"
					title="Frissítés"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<path
							d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>
			{#if byNight && data.night.attendees.length === 0}
				<p class="note">Még senki nem jelezte, hogy jön, így mindenki szavazata számít.</p>
			{/if}
		</div>
	{/if}

	{#if shown.length}
		<div class="grid">
			{#each shown as movie, i (movie.id)}
				<div class="cell" animate:flip={{ duration: 350 }}>
					<MovieCard {movie} eager={i < 4} />
				</div>
			{/each}
		</div>
	{:else if total === 0}
		<div class="empty card">
			<p class="big">🍿</p>
			<h2>Még nincs ajánlott film</h2>
			<p class="muted">Ajánld az első filmet, és kezdődhet a szavazás.</p>
			<a class="btn btn-primary" href="/add">Film ajánlása</a>
		</div>
	{:else}
		<div class="empty card">
			<h2>Nincs találat</h2>
			<p class="muted">
				{filters.needsVote ? 'Mindenre szavaztál. Szép!' : 'Próbálj kikapcsolni egy szűrőt.'}
			</p>
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-top: 16px;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		justify-content: space-between;
	}

	.segmented {
		display: inline-flex;
		padding: 3px;
		border-radius: 999px;
		background: var(--bg-sunken);
		border: 1px solid var(--line);
	}

	.segmented button {
		padding: 6px 14px;
		border: 0;
		border-radius: 999px;
		background: none;
		cursor: pointer;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text-muted);
	}

	.segmented button[aria-pressed='true'] {
		background: var(--accent);
		color: var(--accent-ink);
	}

	.filters {
		display: flex;
		gap: 6px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 999px;
		border: 1px solid var(--line-strong);
		background: none;
		cursor: pointer;
		font-size: 13px;
		font-weight: 550;
		color: var(--text-muted);
	}

	.chip[aria-pressed='true'] {
		border-color: var(--accent);
		color: var(--accent);
		background: rgb(245 181 68 / 0.1);
	}

	.count {
		min-width: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 11px;
		font-weight: 750;
		text-align: center;
	}

	.sort-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.sorts {
		flex: 1;
		min-width: 0;
		display: flex;
		gap: 4px;
		overflow-x: auto;
		scrollbar-width: none;
		margin-left: calc(-1 * var(--gutter));
		padding-left: var(--gutter);
	}

	.sep {
		flex: none;
		align-self: center;
		width: 1px;
		height: 14px;
		margin: 0 4px;
		background: var(--line-strong);
	}

	.sorts a {
		flex: none;
		padding: 6px 12px;
		border-radius: 999px;
		text-decoration: none;
		font-size: 13.5px;
		color: var(--text-faint);
		font-weight: 550;
	}

	.sorts a[aria-current='true'] {
		color: var(--text);
		background: var(--surface);
	}

	.refresh {
		flex: none;
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border-radius: 999px;
		border: 0;
		background: transparent;
		color: var(--text-faint);
		cursor: pointer;
		transition: color 0.15s;
	}

	.refresh:hover {
		color: var(--text);
	}

	.refresh.spin svg {
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.note {
		margin: 0;
		font-size: 13px;
		color: var(--text-faint);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px 14px;
	}

	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 28px 18px;
		}
	}

	@media (min-width: 900px) {
		.grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (min-width: 1150px) {
		.grid {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}

	.cell {
		min-width: 0;
	}

	.empty {
		padding: 40px 24px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.empty p {
		margin: 0;
	}

	.big {
		font-size: 44px;
	}
</style>
