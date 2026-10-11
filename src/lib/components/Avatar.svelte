<script lang="ts">
	let {
		seed,
		name = '',
		size = 32,
		dim = false
	}: { seed: string; name?: string; size?: number; dim?: boolean } = $props();
</script>

<img
	class="avatar"
	class:dim
	src="/avatar/{seed}?v=2"
	alt={name}
	title={name}
	width={size}
	height={size}
	loading="lazy"
/>

<style>
	.avatar {
		border-radius: 50%;
		background: var(--surface);
		flex: none;
		transition:
			opacity 0.15s,
			filter 0.15s;
	}

	.dim {
		opacity: 0.35;
		filter: grayscale(1);
	}
</style>
