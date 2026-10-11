<script lang="ts">
	import Poster from './Poster.svelte';
	import AvailabilityBadge from './AvailabilityBadge.svelte';
	import VoteButtons from './VoteButtons.svelte';
	import Avatar from './Avatar.svelte';
	import type { Tally, VoteValue } from '#lib/scoring.ts';
	import type { DisplayTitle } from '#lib/titles.ts';
	import { formatRuntime } from '#lib/ui.ts';

	type Member = { id: number; nickname: string; avatarSeed: string };
	let {
		movie,
		eager = false
	}: {
		movie: {
			id: number;
			title: DisplayTitle;
			year: number | null;
			runtime: number | null;
			rating: number | null;
			posterPath: string | null;
			availability: 'plex' | 'downloading' | 'requested' | null;
			tally: Tally;
			myVote: VoteValue | null;
			seenBy: Member[];
			commentCount: number;
		};
		eager?: boolean;
	} = $props();

	let details = $derived(
		[movie.year, formatRuntime(movie.runtime), movie.rating ? `★ ${movie.rating.toFixed(1)}` : null]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<article class="movie">
	<a class="link" href="/movie/{movie.id}">
		<div class="poster-wrap">
			<Poster path={movie.posterPath} title={movie.title.main} {eager} />
			<AvailabilityBadge status={movie.availability} />
			{#if movie.myVote === null}<span class="new" title="Még nem szavaztál">új</span>{/if}
		</div>
		<h3 class="title">{movie.title.main}</h3>
		{#if movie.title.original}<p class="original">{movie.title.original}</p>{/if}
		<p class="details">{details}</p>
	</a>

	<VoteButtons movieId={movie.id} myVote={movie.myVote} tally={movie.tally} />

	{#if movie.seenBy.length || movie.commentCount}
		<div class="foot">
			{#if movie.seenBy.length}
				<span class="seen" title="Látta: {movie.seenBy.map((m) => m.nickname).join(', ')}">
					<span class="faces">
						{#each movie.seenBy.slice(0, 4) as m (m.id)}
							<Avatar seed={m.avatarSeed} name={m.nickname} size={18} />
						{/each}
					</span>
					látta
				</span>
			{/if}
			{#if movie.commentCount}
				<a class="comments" href="/movie/{movie.id}#comments">💬 {movie.commentCount}</a>
			{/if}
		</div>
	{/if}
</article>

<style>
	.movie {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.link {
		text-decoration: none;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.poster-wrap {
		position: relative;
		margin-bottom: 8px;
		transition: transform 0.2s;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
	}

	.link:hover .poster-wrap {
		transform: translateY(-3px);
	}

	.new {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 11px;
		font-weight: 750;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.title {
		font-size: 16px;
		overflow-wrap: anywhere;
	}

	.original {
		margin: 0;
		font-size: 13px;
		color: var(--text-muted);
		font-style: italic;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.details {
		margin: 2px 0 0;
		font-size: 12.5px;
		color: var(--text-faint);
	}

	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 12px;
		color: var(--text-faint);
	}

	.seen {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.faces {
		display: inline-flex;
	}

	.faces :global(img + img) {
		margin-left: -6px;
	}

	.comments {
		text-decoration: none;
		margin-left: auto;
	}
</style>
