<script lang="ts">
	import { providerLogoUrl } from '#lib/ui.ts';

	type Status = 'plex' | 'downloading' | 'requested';
	let {
		status,
		offers = [],
		logos = true,
		variant = 'overlay'
	}: {
		status: Status | null;
		/** Where it streams or rents; any of them makes the movie available, like our own Plex. */
		offers?: { name: string; logo: string }[];
		/** Lists the services after the label, Plex first. */
		logos?: boolean;
		variant?: 'overlay' | 'inline';
	} = $props();

	const LABELS = {
		available: { icon: '▶', text: 'Elérhető' },
		downloading: { icon: '↓', text: 'Töltődik' },
		requested: { icon: '⏳', text: 'Keressük' }
	} as const;
	const MAX_LOGOS = 3;

	let shown: keyof typeof LABELS | null = $derived(
		status === 'plex' || offers.length ? 'available' : status
	);
	let services = $derived([
		...(status === 'plex' ? [{ name: 'Plex', src: '/providers/plex.svg' }] : []),
		...offers.map((p) => ({ name: p.name, src: providerLogoUrl(p.logo) }))
	]);
	let title = $derived(
		shown === 'available' && services.length
			? `${LABELS.available.text}: ${services.map((s) => s.name).join(', ')}`
			: shown && LABELS[shown].text
	);
</script>

{#if shown}
	<span class="badge {shown} {variant}" class:crowded={logos && services.length > 2} {title}>
		<span aria-hidden="true">{LABELS[shown].icon}</span>
		<span class="text">{LABELS[shown].text}</span>
		{#if shown === 'available' && logos && services.length}
			<span class="logos">
				{#each services.slice(0, MAX_LOGOS) as s (s.name)}
					<img src={s.src} alt={s.name} width="16" height="16" loading="lazy" />
				{/each}
				{#if services.length > MAX_LOGOS}<span class="more">+{services.length - MAX_LOGOS}</span
					>{/if}
			</span>
		{/if}
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
		max-width: calc(100% - 16px);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow: 0 2px 10px rgb(0 0 0 / 0.4);
	}

	/* On a narrow card, a long row of logos takes the label's place; the ▶ still says "available". */
	@container (max-width: 210px) {
		.overlay.crowded .text {
			display: none;
		}
	}

	.logos {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		margin-left: 2px;
	}

	.logos img {
		display: block;
		border-radius: 4px;
		background: rgb(0 0 0 / 0.2);
	}

	.more {
		font-size: 11px;
	}

	.available {
		background: rgb(229 160 13 / 0.92);
		color: #1a1204;
	}

	.downloading {
		background: rgb(125 211 252 / 0.9);
		color: #04212e;
	}

	.requested {
		background: light-dark(rgb(255 255 255 / 0.9), rgb(27 27 37 / 0.9));
		color: var(--text-muted);
		border: 1px solid var(--line-strong);
	}
</style>
