<script lang="ts">
	let {
		status,
		variant = 'overlay'
	}: { status: 'plex' | 'downloading' | 'requested' | null; variant?: 'overlay' | 'inline' } =
		$props();

	const LABELS = {
		plex: { icon: '▶', text: 'Elérhető' },
		downloading: { icon: '↓', text: 'Töltődik' },
		requested: { icon: '⏳', text: 'Kérve' }
	} as const;
</script>

{#if status}
	<span class="badge {status} {variant}" title={LABELS[status].text}>
		<span aria-hidden="true">{LABELS[status].icon}</span>
		<span class="text">{LABELS[status].text}</span>
	</span>
{/if}

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 9px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 650;
		white-space: nowrap;
	}

	.overlay {
		position: absolute;
		top: 8px;
		left: 8px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow: 0 2px 10px rgb(0 0 0 / 0.4);
	}

	.plex {
		background: rgb(229 160 13 / 0.92);
		color: #1a1204;
	}

	.downloading {
		background: rgb(125 211 252 / 0.9);
		color: #04212e;
	}

	.requested {
		background: rgb(27 27 37 / 0.9);
		color: var(--text-muted);
		border: 1px solid var(--line-strong);
	}
</style>
