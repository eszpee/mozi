<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import { posterUrl, voteEmoji } from '#lib/ui.ts';

	let { data } = $props();
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
						</tr>
					{/each}
				</tbody>
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

	/* The table scrolls inside its box, so the page itself never pans sideways. */
	.matrix {
		width: fit-content;
		max-width: 100%;
		overflow: auto;
		max-height: calc(100dvh - 160px);
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
		position: sticky;
		top: 0;
		z-index: 2;
		background: var(--bg-raised);
		vertical-align: bottom;
	}

	.corner {
		left: 0;
		z-index: 3;
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
		max-width: 260px;
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

	tbody tr:hover th,
	tbody tr:hover td {
		background: var(--surface);
	}
</style>
