<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} · mozi</title></svelte:head>

<div class="wrap err">
	<p class="code">{page.status}</p>
	<h1>{page.status === 404 ? 'Nothing here' : 'Something went wrong'}</h1>
	<p class="muted">{page.error?.message}</p>
	<a class="btn" href="/">Back to the picks</a>
</div>

<style>
	.err {
		padding-top: 64px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		text-align: center;
	}

	.code {
		margin: 0;
		font-family: var(--font-display);
		font-size: 64px;
		font-weight: 800;
		color: var(--accent);
	}

	p {
		margin: 0;
	}
</style>
