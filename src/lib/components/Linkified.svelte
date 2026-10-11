<script lang="ts">
	let { text }: { text: string } = $props();

	const URL_RE = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g;

	let parts = $derived(text.split(URL_RE).map((part, i) => ({ part, link: i % 2 === 1 })));
</script>

<span class="text"
	>{#each parts as { part, link }, i (i)}{#if link}<a
				href={part}
				target="_blank"
				rel="noopener noreferrer nofollow">{part}</a
			>{:else}{part}{/if}{/each}</span
>

<style>
	.text {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	a {
		color: var(--info);
	}
</style>
