<script lang="ts">
	import { enhance } from '$app/forms';
	import Poster from '#lib/components/Poster.svelte';
	import AvailabilityBadge from '#lib/components/AvailabilityBadge.svelte';
	import AgeBadge from '#lib/components/AgeBadge.svelte';
	import VoteButtons from '#lib/components/VoteButtons.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import Linkified from '#lib/components/Linkified.svelte';
	import {
		formatDate,
		formatRuntime,
		languageName,
		personUrl,
		posterUrl,
		providerLogoUrl,
		providerUrl,
		timeAgo,
		trailerUrl,
		voteEmoji
	} from '#lib/ui.ts';

	let { data, form } = $props();
	let movie = $derived(data.movie);

	let confirmWatched = $state(false);
	let confirmRemove = $state(false);
	let editingId: number | null = $state(null);
	let commentBody = $state('');
	let posting = $state(false);

	let details = $derived(
		[movie.year, formatRuntime(movie.runtime), movie.genres.slice(0, 3).join(', ')]
			.filter(Boolean)
			.join(' · ')
	);
	let groups = $derived([
		{ emoji: '👍', people: movie.votes.filter((v) => v.value === 1) },
		{ emoji: '🤷', people: movie.votes.filter((v) => v.value === 0) },
		{ emoji: '👎', people: movie.votes.filter((v) => v.value === -1) }
	]);
	let watched = $derived(movie.watchedAt !== null);

	// Reloads after a vote or comment re-read the thread; keep the "új" marks from arrival.
	let arrival = { movieId: -1, ids: new Set<number>() };
	let newIds = $derived.by(() => {
		if (arrival.movieId !== movie.id)
			arrival = {
				movieId: movie.id,
				ids: new Set(data.comments.filter((c) => c.isNew).map((c) => c.id))
			};
		return arrival.ids;
	});
	// Our own Plex first: if it's downloaded, that's the easiest way to watch it.
	const logo = (p: { name: string; logo: string; url: string | null }) => ({
		name: p.name,
		src: providerLogoUrl(p.logo),
		href: p.url ?? providerUrl(p.name, movie.title.main, movie.providers.link)
	});
	let streams = $derived([
		...(movie.availability === 'plex'
			? [
					{
						name: 'Plex',
						src: '/providers/plex.svg',
						href: providerUrl('Plex', movie.title.main, null)
					}
				]
			: []),
		...movie.providers.stream.map(logo)
	]);
	let rentals = $derived(movie.providers.rent.map(logo));
</script>

<svelte:head><title>{movie.title.main} · mozi</title></svelte:head>

<div class="hero">
	{#if movie.posterPath}
		<div class="backdrop" style:background-image="url({posterUrl(movie.posterPath, 185)})"></div>
	{/if}
	<div class="wrap hero-inner">
		<div class="poster">
			<Poster
				path={movie.posterPath}
				title={movie.title.main}
				eager
				sizes="(min-width: 640px) 220px, 130px"
			/>
			<span class="added-by">
				<Avatar
					seed={movie.addedBy.avatarSeed}
					name="Ajánlotta: {movie.addedBy.nickname}"
					size={32}
				/>
			</span>
		</div>
		<div class="headline">
			<AvailabilityBadge
				status={movie.availability}
				expected={movie.expectedRelease}
				offers={[...movie.providers.stream, ...movie.providers.rent]}
				logos={false}
				variant="inline"
			/>
			<h1>{movie.title.main}</h1>
			{#if movie.title.original}<p class="original">{movie.title.original}</p>{/if}
			<div class="details-row">
				{#if movie.ageRating !== null}<AgeBadge age={movie.ageRating} />{/if}
				<p class="details">{details}</p>
			</div>
			{#if languageName(movie.originalLanguage)}
				<p class="details">Eredeti nyelv: {languageName(movie.originalLanguage)}</p>
			{/if}
			{#each [{ label: movie.directors.length > 1 ? 'Rendezők' : 'Rendező', people: movie.directors }, { label: 'Főszereplők', people: movie.cast }] as row (row.label)}
				{#if row.people.length}
					<p class="details">
						{row.label}:
						{#each row.people as p, i (i)}{@const url = personUrl(p)}{#if url}<a
									class="person-link"
									href={url}
									target="_blank"
									rel="noopener noreferrer">{p.name}</a
								>{:else}{p.name}{/if}{i < row.people.length - 1 ? ', ' : ''}{/each}
					</p>
				{/if}
			{/each}
			{#each [{ label: 'Elérhető', list: streams }, { label: 'Bérelhető', list: rentals }] as row (row.label)}
				{#if row.list.length}
					<div class="providers">
						<span class="details">{row.label}:</span>
						{#each row.list as p (p.name)}
							<a href={p.href} target="_blank" rel="noopener noreferrer">
								<img
									src={p.src}
									alt={p.name}
									title={p.name}
									width="28"
									height="28"
									loading="lazy"
								/>
							</a>
						{/each}
					</div>
				{/if}
			{/each}
			{#if movie.rating}<p class="rating">★ {movie.rating.toFixed(1)} <span>TMDB</span></p>{/if}
			<div class="links">
				{#if movie.imdbId}
					<a
						class="btn btn-small"
						href="https://www.imdb.com/title/{movie.imdbId}/"
						target="_blank"
						rel="noopener noreferrer">IMDb ↗</a
					>
				{/if}
				<a
					class="btn btn-small"
					href={trailerUrl(movie.trailerKey, movie.title.main, movie.year)}
					target="_blank"
					rel="noopener noreferrer">▶ Előzetes</a
				>
			</div>
		</div>
	</div>
</div>

<div class="wrap body">
	{#if watched}
		<p class="watched-note card">
			✓ Együtt néztük meg: {formatDate(movie.watchedAt!)}. A szavazás lezárult.
			<a href="/watched">Az összes megnézett</a>
		</p>
	{/if}

	<section class="vote-section">
		<VoteButtons
			movieId={movie.id}
			myVote={movie.myVote}
			tally={movie.tally}
			size="large"
			disabled={watched}
		/>
		<div class="voters">
			{#each groups as g (g.emoji)}
				{#if g.people.length}
					<div class="group">
						<span class="emoji">{g.emoji}</span>
						{#each g.people as v (v.member.id)}
							<span class="person"
								><Avatar seed={v.member.avatarSeed} name={v.member.nickname} size={22} />{v.member
									.nickname}</span
							>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</section>

	<section class="actions">
		<form
			method="POST"
			action="?/seen"
			use:enhance={() =>
				async ({ update }) =>
					update({ reset: false })}
		>
			<input type="hidden" name="movieId" value={movie.id} />
			<button
				class="btn btn-small"
				class:on={movie.mySeen}
				type="submit"
				aria-pressed={movie.mySeen}
			>
				{movie.mySeen ? '✓ Már láttam' : 'Már láttam'}
			</button>
		</form>

		{#if !watched}
			{#if confirmWatched}
				<form method="POST" action="?/watched" class="confirm">
					<span class="muted">
						{data.attendees.length
							? `Látottnak jelöli nekik: ${data.attendees.map((a) => a.nickname).join(', ')}, és új estét kezd.`
							: 'Archiválja, és új estét kezd.'}
					</span>
					<button class="btn btn-small btn-primary" type="submit">Igen, megnéztük</button>
					<button
						class="btn btn-small btn-ghost"
						type="button"
						onclick={() => (confirmWatched = false)}>Mégse</button
					>
				</form>
			{:else}
				<button class="btn btn-small" type="button" onclick={() => (confirmWatched = true)}
					>🎬 Megnéztük</button
				>
			{/if}
		{/if}

		{#if data.canRequest}
			<form method="POST" action="?/request" use:enhance>
				<button class="btn btn-small" type="submit">⬇ Töltsük le</button>
			</form>
		{/if}
		{#if form?.requestError}<p class="error-text">{form.requestError}</p>{/if}

		{#if data.admin}
			{#if confirmRemove}
				<form method="POST" action="?/remove" class="confirm">
					<button class="btn btn-small danger" type="submit">Törlés mindenkinek</button>
					<button
						class="btn btn-small btn-ghost"
						type="button"
						onclick={() => (confirmRemove = false)}>Mégse</button
					>
				</form>
			{:else}
				<button
					class="btn btn-small btn-ghost danger-text"
					type="button"
					onclick={() => (confirmRemove = true)}>Törlés</button
				>
			{/if}
		{/if}
	</section>

	{#if movie.seenBy.length}
		<p class="seen-by">
			<span class="faint">Látta</span>
			{#each movie.seenBy as m (m.id)}
				<span class="person"
					><Avatar seed={m.avatarSeed} name={m.nickname} size={22} />{m.nickname}</span
				>
			{/each}
		</p>
	{/if}

	{#if movie.overview}<p class="overview">{movie.overview}</p>{/if}
	<p class="faint added">Ajánlotta: {movie.addedBy.nickname} · {timeAgo(movie.addedAt)}</p>

	<section id="comments" class="comments">
		<h2>
			Hozzászólások {#if data.comments.length}<span class="faint">{data.comments.length}</span>{/if}
		</h2>
		{#if data.comments.length}
			<ol class="thread">
				{#each data.comments as c (c.id)}
					<li class="comment">
						<Avatar seed={c.author.avatarSeed} name={c.author.nickname} size={34} />
						<div class="bubble">
							<p class="meta">
								<strong>{c.author.nickname}</strong>
								{#if newIds.has(c.id)}<span class="new">új</span>{/if}
								{#if c.authorVote !== null}<span title="Szavazata">{voteEmoji(c.authorVote)}</span
									>{/if}
								<span class="faint">{timeAgo(c.createdAt)}{c.edited ? ' · szerkesztve' : ''}</span>
							</p>
							{#if editingId === c.id}
								<form
									method="POST"
									action="?/editComment"
									class="edit"
									use:enhance={() =>
										async ({ update, result }) => {
											await update({ reset: false });
											if (result.type === 'success') editingId = null;
										}}
								>
									<input type="hidden" name="commentId" value={c.id} />
									<textarea class="input" name="body" maxlength="2000" required>{c.body}</textarea>
									<div class="row">
										<button class="btn btn-small btn-primary" type="submit">Mentés</button>
										<button
											class="btn btn-small btn-ghost"
											type="button"
											onclick={() => (editingId = null)}>Mégse</button
										>
									</div>
								</form>
							{:else}
								<p class="text"><Linkified text={c.body} /></p>
								{#if c.mine || data.admin}
									<div class="tools">
										{#if c.mine}<button type="button" onclick={() => (editingId = c.id)}
												>Szerkesztés</button
											>{/if}
										<form
											method="POST"
											action="?/deleteComment"
											use:enhance={() =>
												async ({ update }) =>
													update({ reset: false })}
										>
											<input type="hidden" name="commentId" value={c.id} />
											<button type="submit">Törlés</button>
										</form>
									</div>
								{/if}
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="faint">Még nincs hozzászólás. Miért nézzük meg (vagy miért ne)?</p>
		{/if}

		<form
			method="POST"
			action="?/comment"
			class="new-comment"
			use:enhance={() => {
				posting = true;
				return async ({ update, result }) => {
					await update({ reset: false });
					if (result.type === 'success') commentBody = '';
					posting = false;
				};
			}}
		>
			<label for="comment" class="sr-only">Hozzászólás írása</label>
			<textarea
				id="comment"
				class="input"
				name="body"
				maxlength="2000"
				rows="2"
				placeholder="Írj hozzászólást…"
				required
				bind:value={commentBody}></textarea>
			{#if form?.commentError}<p class="error-text">{form.commentError}</p>{/if}
			<button
				class="btn btn-primary btn-small"
				type="submit"
				disabled={posting || !commentBody.trim()}>Küldés</button
			>
		</form>
	</section>
</div>

<style>
	.hero {
		position: relative;
		overflow: hidden;
		/* Safari can leak a blurred child past overflow: hidden; paint containment can't. */
		contain: paint;
		border-bottom: 1px solid var(--line);
	}

	.backdrop {
		position: absolute;
		inset: -40px;
		background-size: cover;
		background-position: center;
		filter: blur(40px) saturate(1.3);
		opacity: 0.35;
	}

	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, transparent 30%, var(--bg));
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 16px;
		padding-top: 20px;
		padding-bottom: 20px;
		align-items: start;
	}

	@media (min-width: 640px) {
		.hero-inner {
			grid-template-columns: 220px 1fr;
			gap: 28px;
			padding-top: 36px;
			padding-bottom: 28px;
		}
	}

	.poster {
		position: relative;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
	}

	/* Same treatment as on the movie cards. */
	.added-by {
		position: absolute;
		left: 8px;
		bottom: 8px;
		display: flex;
		padding: 2px;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.45);
		box-shadow: 0 2px 10px rgb(0 0 0 / 0.4);
	}

	.person-link {
		color: inherit;
		text-decoration-color: var(--line-strong);
		text-underline-offset: 3px;
	}

	.person-link:hover {
		color: var(--text);
	}

	.headline {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-start;
		min-width: 0;
	}

	h1 {
		font-size: clamp(24px, 6vw, 44px);
		overflow-wrap: anywhere;
	}

	.original {
		margin: 0;
		font-style: italic;
		color: var(--text-muted);
	}

	.details,
	.rating {
		margin: 0;
		font-size: 14px;
		color: var(--text-muted);
	}

	.details-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.providers {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	.providers .details {
		margin-right: 2px;
	}

	.providers a {
		display: flex;
	}

	.providers img {
		border-radius: 7px;
		background: var(--surface);
	}

	.rating {
		color: var(--accent);
		font-weight: 650;
	}

	.rating span {
		color: var(--text-faint);
		font-weight: 500;
		font-size: 12px;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 6px;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding-top: 20px;
		max-width: 760px;
	}

	.watched-note {
		margin: 0;
		padding: 12px 16px;
		color: var(--up);
	}

	.watched-note a {
		color: var(--text-muted);
		margin-left: 6px;
	}

	.vote-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.voters {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.group,
	.seen-by {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 10px;
		margin: 0;
	}

	.group .emoji {
		font-size: 18px;
		width: 24px;
	}

	.person {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 13.5px;
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	.btn.on {
		border-color: var(--up);
		color: var(--up);
	}

	.confirm {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		padding: 10px 12px;
		border-radius: var(--radius);
		background: var(--bg-raised);
		border: 1px solid var(--line);
		font-size: 13px;
	}

	.danger {
		background: var(--down);
		border-color: var(--down);
		color: #2a0610;
	}

	.danger-text {
		color: var(--down);
	}

	.overview {
		margin: 0;
		color: var(--text-muted);
		line-height: 1.6;
	}

	.added {
		margin: -10px 0 0;
		font-size: 13px;
	}

	.comments {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding-top: 8px;
		border-top: 1px solid var(--line);
	}

	.comments h2 {
		font-size: 20px;
		padding-top: 16px;
	}

	.thread {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.comment {
		display: grid;
		grid-template-columns: 34px 1fr;
		gap: 10px;
	}

	.bubble {
		min-width: 0;
		padding: 10px 14px;
		border-radius: 4px var(--radius) var(--radius) var(--radius);
		background: var(--bg-raised);
		border: 1px solid var(--line);
	}

	.meta {
		margin: 0 0 2px;
		display: flex;
		gap: 6px;
		align-items: baseline;
		font-size: 13px;
	}

	.text {
		margin: 0;
	}

	.new {
		padding: 0 6px;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 10.5px;
		font-weight: 750;
		align-self: center;
	}

	.tools {
		display: flex;
		gap: 12px;
		margin-top: 6px;
	}

	.tools button {
		background: none;
		border: 0;
		padding: 0;
		font-size: 12px;
		color: var(--text-faint);
		cursor: pointer;
	}

	.tools button:hover {
		color: var(--text);
	}

	.edit {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 6px;
	}

	.row {
		display: flex;
		gap: 8px;
	}

	.new-comment {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: flex-end;
	}

	.new-comment textarea {
		min-height: 64px;
	}

	.faint {
		color: var(--text-faint);
	}
</style>
