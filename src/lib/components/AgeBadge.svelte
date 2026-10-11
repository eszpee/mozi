<script lang="ts">
	let { age }: { age: 0 | 6 | 12 | 16 | 18 } = $props();

	const TITLES = {
		0: 'Korhatár nélkül megtekinthető',
		6: '6 éven aluliak számára nem ajánlott',
		12: '12 éven aluliak számára nem ajánlott',
		16: '16 éven aluliak számára nem ajánlott',
		18: '18 éven aluliak számára nem ajánlott'
	} as const;
</script>

<span class="age a{age}" title={TITLES[age]} aria-label={TITLES[age]}>
	{age}+
</span>

<style>
	.age {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 30px;
		height: 30px;
		padding: 0 4px;
		border-radius: 999px;
		border: 2px solid currentColor;
		font-size: 11.5px;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1;
		background: rgb(0 0 0 / 0.35);
		flex: none;
	}

	.a0 {
		color: #4cc36b;
	}

	.a6 {
		color: #8fd14f;
	}

	.a12 {
		color: #f5c542;
	}

	.a16 {
		color: #f59342;
	}

	.a18 {
		color: #f0524f;
	}
</style>
