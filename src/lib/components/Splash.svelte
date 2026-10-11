<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<section class="splash">
	<div class="panel card">
		<p class="logo">mozi<span>.</span></p>
		{@render children()}
	</div>
</section>

<style>
	.splash {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 24px var(--gutter);
	}

	.panel {
		width: 100%;
		max-width: 400px;
		padding: 32px 24px;
		text-align: center;
		box-shadow: var(--shadow);
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.logo {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 44px;
		letter-spacing: -0.05em;
		margin: 0;
	}

	.logo span {
		color: var(--accent);
	}
</style>
