<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Avatar from '#lib/components/Avatar.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// Lets e2e tests wait until the page is interactive.
	onMount(() => {
		document.documentElement.dataset.hydrated = '';
	});

	// Fixed time zone, so server and browser render the same text.
	const buildDate = new Intl.DateTimeFormat('hu-HU', {
		dateStyle: 'short',
		timeStyle: 'short',
		timeZone: 'Europe/Budapest'
	}).format(new Date(__BUILD_DATE__));

	const nav = [
		{ href: '/', label: 'Filmek' },
		{ href: '/watched', label: 'Láttuk már' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="theme-color" content="#0b0b10" />
	<title>mozi</title>
</svelte:head>

{#if data.me}
	<header class="top">
		<div class="wrap bar">
			<a href="/" class="logo" aria-label="mozi kezdőlap">mozi<span>.</span></a>
			<nav>
				{#each nav as item (item.href)}
					<a href={item.href} aria-current={page.url.pathname === item.href ? 'page' : undefined}>
						{item.label}
					</a>
				{/each}
			</nav>
			<a class="btn btn-primary btn-small add" href="/add" aria-label="Film ajánlása">
				<span aria-hidden="true">＋</span><span class="add-label">Ajánlok</span>
			</a>
			<details class="me">
				<summary aria-label="Fiókmenü">
					<Avatar seed={data.me.avatarSeed} name={data.me.nickname} size={34} />
				</summary>
				<div class="menu card">
					<p class="who">{data.me.nickname}</p>
					<a href="/welcome">Név és avatár</a>
					{#if data.me.admin}<a href="/admin">Admin</a>{/if}
					<form method="POST" action="/auth/logout">
						<button type="submit">Kijelentkezés</button>
					</form>
				</div>
			</details>
		</div>
	</header>
{/if}

<main>
	{@render children()}
</main>

<footer class="build">build date: {buildDate}</footer>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 20;
		background: rgb(11 11 16 / 0.82);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--line);
		/* Home-screen app on iOS draws under the status bar. */
		padding-top: env(safe-area-inset-top);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 12px;
		height: 60px;
	}

	.logo {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 24px;
		letter-spacing: -0.04em;
		text-decoration: none;
	}

	.logo span {
		color: var(--accent);
	}

	nav {
		display: flex;
		gap: 2px;
		margin-left: 6px;
		flex: 1;
		min-width: 0;
	}

	nav a {
		padding: 6px 10px;
		border-radius: 999px;
		text-decoration: none;
		color: var(--text-muted);
		font-weight: 550;
		font-size: 14px;
	}

	nav a[aria-current='page'] {
		color: var(--text);
		background: var(--surface);
	}

	.add-label {
		display: none;
	}

	@media (min-width: 560px) {
		.add-label {
			display: inline;
		}
	}

	.me {
		position: relative;
	}

	.me summary {
		list-style: none;
		cursor: pointer;
		display: flex;
	}

	.me summary::-webkit-details-marker {
		display: none;
	}

	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		min-width: 200px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow);
	}

	.menu .who {
		margin: 4px 10px 8px;
		font-weight: 650;
	}

	.menu a,
	.menu button {
		text-align: left;
		padding: 10px;
		border-radius: var(--radius-s);
		text-decoration: none;
		background: none;
		border: 0;
		cursor: pointer;
		width: 100%;
		color: var(--text-muted);
	}

	.menu a:hover,
	.menu button:hover {
		background: var(--surface);
		color: var(--text);
	}

	main {
		padding-bottom: 64px;
	}

	.build {
		padding: 0 16px 20px;
		text-align: center;
		font-size: 11px;
		color: #3b3a46;
	}
</style>
