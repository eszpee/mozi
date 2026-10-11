import { syncAvailability } from '#lib/server/arr.ts';
import { refreshStaleMeta } from '#lib/server/movies.ts';

let started = false;

const MINUTE = 60_000;

/** Periodic in-process jobs: Plex/Radarr availability and TMDB metadata refresh. Idempotent. */
export function startBackgroundJobs() {
	if (started) return;
	started = true;

	const run = (name: string, fn: () => Promise<unknown>) => () =>
		fn().catch((e) => console.error(`Job ${name} failed`, e));

	const sync = run('availability', syncAvailability);
	const refresh = run('metadata', () => refreshStaleMeta());

	setTimeout(sync, 5_000).unref();
	setInterval(sync, 10 * MINUTE).unref();
	setInterval(refresh, 60 * MINUTE).unref();
}
