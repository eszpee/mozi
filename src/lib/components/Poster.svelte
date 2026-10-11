<script lang="ts">
	import { posterUrl } from '#lib/ui.ts';

	let {
		path,
		title,
		eager = false,
		sizes = '(min-width: 1000px) 220px, (min-width: 640px) 30vw, 46vw'
	}: { path: string | null; title: string; eager?: boolean; sizes?: string } = $props();
</script>

<div class="poster">
	{#if path}
		<img
			src={posterUrl(path, 342)}
			srcset="{posterUrl(path, 185)} 185w, {posterUrl(path, 342)} 342w, {posterUrl(path, 500)} 500w"
			{sizes}
			alt="{title} plakátja"
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
		/>
	{:else}
		<div class="placeholder" aria-hidden="true">
			<span>{title}</span>
		</div>
	{/if}
</div>

<style>
	.poster {
		position: relative;
		aspect-ratio: 2 / 3;
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--surface);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 16px;
		text-align: center;
		background:
			radial-gradient(circle at 30% 20%, rgb(245 181 68 / 0.25), transparent 55%),
			linear-gradient(160deg, #25253a, #12121a);
	}

	.placeholder span {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 18px;
		line-height: 1.2;
		color: var(--text-muted);
	}
</style>
