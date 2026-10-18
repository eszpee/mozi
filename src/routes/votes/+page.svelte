<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import { VOTE_OPTIONS, posterUrl, voteEmoji } from '#lib/ui.ts';
	import type { VoteValue } from '#lib/scoring.ts';

	let { data } = $props();

	const count = (values: (VoteValue | undefined)[], v: VoteValue) =>
		values.filter((x) => x === v).length;
	// Zero shows as an empty cell.
	const blank = (n: number) => n || '';

	let rowTotals = $derived(
		new Map(
			data.rows.map((r) => [
				r.id,
				VOTE_OPTIONS.map((o) =>
					count(
						data.members.map((m) => r.votes[m.id]),
						o.value
					)
				)
			])
		)
	);
	let columnTotals = $derived(
		VOTE_OPTIONS.map((o) =>
			data.members.map((m) =>
				count(
					data.rows.map((r) => r.votes[m.id]),
					o.value
				)
			)
		)
	);
</script>

<svelte:head><title>Szavazatok · mozi</title></svelte:head>

<div class="wrap page">
	<h1>Szavazatok</h1>
	{#if data.rows.length}
		<div class="matrix">
			<table>
				<thead>
					<tr>
						<th class="corner" scope="col"><span class="sr-only">Film</span></th>
						{#each data.members as m (m.id)}
							<th class="person" scope="col">
								<div class="person-inner">
									<Avatar seed={m.avatarSeed} name={m.nickname} size={24} />
									<span class="name">{m.nickname}</span>
								</div>
							</th>
						{/each}
						{#each VOTE_OPTIONS as o, i (o.value)}
							<th class="total-head" class:first={i === 0} scope="col" title={o.label}>{o.emoji}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.rows as r (r.id)}
						<tr>
							<th class="movie" scope="row">
								<a href="/movie/{r.id}">
									<Avatar
										seed={r.addedBy.avatarSeed}
										name="Ajánlotta: {r.addedBy.nickname}"
										size={20}
									/>
									{#if r.posterPath}
										<img class="thumb" src={posterUrl(r.posterPath, 185)} alt="" loading="lazy" />
									{:else}
										<span class="thumb"></span>
									{/if}
									<span class="title">{r.title}</span>
									{#if r.year}<span class="year">{r.year}</span>{/if}
								</a>
							</th>
							{#each data.members as m (m.id)}
								<td>{voteEmoji(r.votes[m.id] ?? null)}</td>
							{/each}
							{#each rowTotals.get(r.id)! as n, i (i)}
								<td class="total" class:first={i === 0}>{blank(n)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
				<tfoot>
					{#each VOTE_OPTIONS as o, i (o.value)}
						<tr class:first={i === 0}>
							<th class="movie total-label" scope="row" title={o.label}>{o.emoji}</th>
							{#each columnTotals[i] as n, j (j)}
								<td class="total">{blank(n)}</td>
							{/each}
							<!-- Where the same vote's row and column meet: its grand total. -->
							{#each VOTE_OPTIONS as col, j (col.value)}
								<td class="total" class:first={j === 0}>
									{i === j ? blank(columnTotals[i].reduce((a, b) => a + b, 0)) : ''}
								</td>
							{/each}
						</tr>
					{/each}
				</tfoot>
			</table>
		</div>
	{:else}
		<p class="muted">Nincs nyitott film.</p>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-top: 20px;
	}

	h1 {
		font-size: 26px;
	}

	/* Phones: the table scrolls sideways inside its box, so the page never pans. */
	.matrix {
		width: fit-content;
		max-width: 100%;
		overflow-x: auto;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--bg-raised);
	}

	table {
		border-collapse: separate;
		border-spacing: 0;
		font-size: 13px;
	}

	th,
	td {
		border-bottom: 1px solid var(--line);
	}

	thead th {
		background: var(--bg-raised);
		vertical-align: bottom;
	}

	.person {
		padding: 8px 2px;
		font-weight: 550;
	}

	.person-inner {
		display: flex;
		flex-direction: column-reverse;
		align-items: center;
		gap: 6px;
	}

	.name {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		white-space: nowrap;
		color: var(--text-muted);
	}

	.movie {
		position: sticky;
		left: 0;
		z-index: 1;
		background: var(--bg-raised);
		border-right: 1px solid var(--line);
		text-align: left;
		font-weight: 500;
		padding: 0;
	}

	.movie a {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 10px 4px 8px;
		max-width: 220px;
		text-decoration: none;
		color: var(--text);
	}

	.thumb {
		flex: none;
		width: 20px;
		height: 30px;
		border-radius: 3px;
		object-fit: cover;
		background: var(--surface);
	}

	.title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.year {
		flex: none;
		color: var(--text-faint);
	}

	td {
		min-width: 34px;
		text-align: center;
		font-size: 16px;
	}

	.total-head {
		padding: 8px 4px;
		font-size: 16px;
	}

	.total {
		font-size: 13px;
		font-weight: 650;
		color: var(--text-muted);
		background: var(--bg-sunken);
	}

	/* A heavier line sets the totals apart from the votes. */
	.first {
		border-left: 2px solid var(--line-strong);
	}

	tfoot tr.first > * {
		border-top: 2px solid var(--line-strong);
	}

	.total-label {
		text-align: right;
		padding: 4px 12px;
		font-size: 16px;
	}

	tbody tr:hover th,
	tbody tr:hover td {
		background: var(--surface);
	}

	/* Wider screens: full titles, and the whole table on the page with the names
	   pinned under the site header while scrolling. */
	@media (min-width: 640px) {
		.matrix {
			overflow: visible;
		}

		.movie a {
			max-width: none;
		}

		.title {
			overflow: visible;
		}

		thead th {
			position: sticky;
			top: calc(60px + env(safe-area-inset-top));
			z-index: 2;
		}
	}
</style>
