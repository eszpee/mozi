<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Tally, VoteValue } from '#lib/scoring.ts';
	import { VOTE_OPTIONS } from '#lib/ui.ts';

	let {
		movieId,
		myVote,
		tally,
		votes = [],
		disabled = false,
		size = 'normal'
	}: {
		movieId: number;
		myVote: VoteValue | null;
		tally: Tally;
		/** Who voted what; their names show on hover. */
		votes?: { member: { nickname: string }; value: VoteValue }[];
		disabled?: boolean;
		size?: 'normal' | 'large';
	} = $props();

	// Optimistic state while the request is in flight.
	let pending = $state<{ vote: VoteValue | null } | null>(null);
	let shown = $derived(pending ? pending.vote : myVote);

	const countOf = (v: VoteValue) => {
		const base = v === 1 ? tally.up : v === 0 ? tally.meh : tally.down;
		if (!pending) return base;
		return base - (myVote === v ? 1 : 0) + (pending.vote === v ? 1 : 0);
	};

	/** The voters' names, or what the button means while nobody has picked it. */
	const hoverOf = (option: (typeof VOTE_OPTIONS)[number]) => {
		const names = votes.filter((v) => v.value === option.value).map((v) => v.member.nickname);
		return names.length ? names.join(', ') : option.label;
	};
</script>

<form
	method="POST"
	action="?/vote"
	class="votes {size}"
	use:enhance={({ formData }) => {
		const value = Number(formData.get('value')) as VoteValue;
		pending = { vote: shown === value ? null : value };
		return async ({ update }) => {
			await update({ reset: false });
			pending = null;
		};
	}}
>
	<input type="hidden" name="movieId" value={movieId} />
	{#each VOTE_OPTIONS as option (option.value)}
		<button
			type="submit"
			name="value"
			value={option.value}
			class="vote"
			class:mine={shown === option.value}
			aria-pressed={shown === option.value}
			aria-label="{option.label} ({countOf(option.value)})"
			title={hoverOf(option)}
			{disabled}
		>
			<span class="emoji" aria-hidden="true">{option.emoji}</span>
			<span class="count" aria-hidden="true">{countOf(option.value)}</span>
		</button>
	{/each}
</form>

<style>
	.votes {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
		padding: 3px;
		border-radius: 999px;
		background: var(--bg-sunken);
		border: 1px solid var(--line);
	}

	.vote {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-height: 36px;
		border-radius: 999px;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		font-size: 13px;
		font-weight: 650;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		transition:
			background 0.15s,
			transform 0.1s;
	}

	.vote:hover:not(:disabled) {
		background: var(--surface);
	}

	.vote:active:not(:disabled) {
		transform: scale(0.94);
	}

	.vote:disabled {
		cursor: default;
	}

	.emoji {
		font-size: 16px;
		filter: grayscale(0.6);
		opacity: 0.8;
	}

	.mine {
		background: var(--surface-hover);
		border-color: var(--line-strong);
		color: var(--text);
	}

	.mine .emoji {
		filter: none;
		opacity: 1;
	}

	.large .vote {
		min-height: 48px;
		font-size: 15px;
	}

	.large .emoji {
		font-size: 22px;
	}
</style>
