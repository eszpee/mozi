<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from './Avatar.svelte';
	import { formatNightDate } from '#lib/ui.ts';

	type Member = { id: number; nickname: string; avatarSeed: string };
	let {
		night,
		members
	}: {
		night: { label: string | null; date: string | null; attendees: number[] };
		members: Member[];
	} = $props();

	let attending = $derived(new Set(night.attendees));
	let heading = $derived(
		[night.label, formatNightDate(night.date)].filter(Boolean).join(' · ') || 'Date to be decided'
	);
</script>

<section class="night card" aria-label="Next movie night">
	<div class="head">
		<div>
			<p class="eyebrow">Next movie night</p>
			<h2>{heading}</h2>
		</div>
		<a class="btn btn-small btn-ghost" href="/night">Edit</a>
	</div>
	<p class="hint">Who’s coming? Tap to toggle.</p>
	<ul class="people">
		{#each members as m (m.id)}
			{@const on = attending.has(m.id)}
			<li>
				<form
					method="POST"
					action="?/attend"
					use:enhance={() =>
						async ({ update }) =>
							update({ reset: false })}
				>
					<input type="hidden" name="userId" value={m.id} />
					<input type="hidden" name="attending" value={on ? 'false' : 'true'} />
					<button type="submit" class="person" class:on aria-pressed={on}>
						<Avatar seed={m.avatarSeed} size={40} dim={!on} />
						<span>{m.nickname}</span>
					</button>
				</form>
			</li>
		{/each}
	</ul>
</section>

<style>
	.night {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: linear-gradient(135deg, rgb(245 181 68 / 0.1), transparent 60%), var(--bg-raised);
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.eyebrow {
		margin: 0;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--accent);
		font-weight: 700;
	}

	h2 {
		font-size: 20px;
	}

	.hint {
		margin: 0;
		font-size: 13px;
		color: var(--text-faint);
	}

	.people {
		list-style: none;
		margin: 0;
		padding: 4px 0 0;
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.person {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		width: 62px;
		padding: 4px 0;
		background: none;
		border: 0;
		border-radius: var(--radius-s);
		cursor: pointer;
		font-size: 11.5px;
		color: var(--text-faint);
	}

	.person span {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.person.on {
		color: var(--text);
		font-weight: 600;
	}
</style>
