<script lang="ts">
	import NightStrip from '#lib/components/NightStrip.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Következő este · mozi</title></svelte:head>

<div class="wrap page">
	<h1>Következő mozis este</h1>
	<form method="POST" action="?/save" class="card fields">
		<label>
			<span class="muted">Név (nem kötelező)</span>
			<input
				class="input"
				name="label"
				maxlength="60"
				placeholder="pl. Novemberben Bencééknél"
				value={data.night.label ?? ''}
			/>
		</label>
		<label>
			<span class="muted">Dátum (nem kötelező)</span>
			<input class="input" name="date" type="date" value={data.night.date ?? ''} />
		</label>
		{#if form?.error}<p class="error-text">{form.error}</p>{/if}
		<div class="row">
			<button class="btn btn-primary" type="submit">Mentés</button>
			<a class="btn btn-ghost" href="/">Mégse</a>
		</div>
	</form>
	<NightStrip night={data.night} members={data.members} />
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-top: 20px;
		max-width: 560px;
	}

	h1 {
		font-size: 26px;
	}

	.fields {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 14px;
	}

	.row {
		display: flex;
		gap: 8px;
	}

	p {
		margin: 0;
	}

	.page :global(.night .btn) {
		display: none;
	}
</style>
