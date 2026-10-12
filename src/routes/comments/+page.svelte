<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import Poster from '#lib/components/Poster.svelte';
	import { timeAgo } from '#lib/ui.ts';

	let { data } = $props();
</script>

<svelte:head><title>Beszélgetések · mozi</title></svelte:head>

<div class="wrap page">
	<h1>Beszélgetések</h1>
	{#if data.conversations.length}
		<ul class="list">
			{#each data.conversations as c (c.movieId)}
				<li>
					<a class="conversation" class:unread={c.newCount} href="/movie/{c.movieId}#comments">
						<div class="thumb">
							<Poster path={c.posterPath} title={c.title.main} sizes="72px" />
						</div>
						<div class="info">
							<p class="title">
								{c.title.main}
								{#if c.newCount}<span class="new">{c.newCount} új</span>{/if}
							</p>
							<div class="latest">
								<Avatar seed={c.latest.author.avatarSeed} size={24} />
								<p class="meta">
									<strong>{c.latest.author.nickname}</strong>
									<span class="faint">{timeAgo(c.latest.createdAt)}</span>
								</p>
							</div>
							<p class="body">{c.latest.body}</p>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty card">
			<p class="muted">Még senki nem szólt hozzá semmihez.</p>
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

	.conversation {
		display: grid;
		grid-template-columns: 64px 1fr;
		gap: 14px;
		align-items: start;
		padding: 10px;
		border-radius: var(--radius);
		background: var(--bg-raised);
		border: 1px solid var(--line);
		text-decoration: none;
		color: inherit;
	}

	.conversation.unread {
		border-color: var(--accent);
	}

	.new {
		margin-left: 6px;
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 11px;
		font-weight: 750;
		vertical-align: 2px;
	}

	.conversation:hover {
		border-color: var(--text-faint);
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
		gap: 6px;
	}

	p {
		margin: 0;
	}

	.title {
		font-weight: 650;
		font-size: 16px;
	}

	.latest {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.meta {
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: 13px;
	}

	.body {
		font-size: 14px;
		color: var(--text-muted);
		white-space: pre-line;
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.empty {
		padding: 32px 24px;
		text-align: center;
	}
</style>
