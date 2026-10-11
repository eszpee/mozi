/**
 * Keeps a list's order stable across data refreshes, so cards don't jump under
 * the user's finger after a vote. Ids already shown keep their place as long as
 * they still exist (even if they no longer match a filter); ids that are new to
 * the fresh ranking are appended in their ranked order.
 */
export function stableOrder(
	shown: readonly number[],
	fresh: readonly number[],
	existing: ReadonlySet<number>
): number[] {
	const kept = shown.filter((id) => existing.has(id));
	const keptSet = new Set(kept);
	return [...kept, ...fresh.filter((id) => !keptSet.has(id))];
}
