import { sql } from 'drizzle-orm';
import {
	PLEX_TOKEN,
	PLEX_URL,
	RADARR_API_KEY,
	RADARR_QUALITY_PROFILE_ID,
	RADARR_ROOT_FOLDER,
	RADARR_URL
} from '$app/env/private';
import { db, schema } from '#lib/server/db/index.ts';
import {
	computeAvailability,
	tmdbIdsFromPlexGuids,
	type RadarrMovie,
	type RadarrQueueItem
} from './availability.ts';

const TIMEOUT = 15_000;

export const radarrConfigured = () => !!(RADARR_URL && RADARR_API_KEY);
const plexConfigured = () => !!(PLEX_URL && PLEX_TOKEN);

async function radarr<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${RADARR_URL}/api/v3${path}`, {
		...init,
		headers: { 'x-api-key': RADARR_API_KEY, 'content-type': 'application/json', ...init.headers },
		signal: AbortSignal.timeout(TIMEOUT)
	});
	if (!res.ok) throw new Error(`Radarr ${path}: ${res.status} ${await res.text()}`);
	return res.json() as Promise<T>;
}

async function plex<T>(path: string): Promise<T> {
	const url = new URL(path, PLEX_URL);
	url.searchParams.set('X-Plex-Token', PLEX_TOKEN);
	const res = await fetch(url, {
		headers: { accept: 'application/json' },
		signal: AbortSignal.timeout(TIMEOUT)
	});
	if (!res.ok) throw new Error(`Plex ${path}: ${res.status}`);
	return res.json() as Promise<T>;
}

async function plexMovieTmdbIds(): Promise<number[]> {
	type Sections = { MediaContainer: { Directory?: { key: string; type: string }[] } };
	type Items = { MediaContainer: { Metadata?: { Guid?: { id: string }[] }[] } };
	const sections = await plex<Sections>('/library/sections');
	const movieSections = (sections.MediaContainer.Directory ?? []).filter((d) => d.type === 'movie');
	const ids: number[] = [];
	for (const section of movieSections) {
		const items = await plex<Items>(`/library/sections/${section.key}/all?includeGuids=1`);
		for (const item of items.MediaContainer.Metadata ?? [])
			ids.push(...tmdbIdsFromPlexGuids(item.Guid));
	}
	return ids;
}

export type SyncResult = { at: number; count: number; error: string | null };
let lastSync: SyncResult | null = null;
export const getLastSync = () => lastSync;

/** Rebuilds the availability table from Plex and Radarr. Either source may be missing. */
export async function syncAvailability(): Promise<SyncResult> {
	try {
		const [plexIds, movies, queue] = await Promise.all([
			plexConfigured() ? plexMovieTmdbIds() : Promise.resolve([]),
			radarrConfigured() ? radarr<RadarrMovie[]>('/movie') : Promise.resolve([]),
			radarrConfigured()
				? radarr<{ records: RadarrQueueItem[] }>('/queue?pageSize=500').then((q) => q.records)
				: Promise.resolve([])
		]);
		const status = computeAvailability(plexIds, movies, queue);
		const syncedAt = new Date();
		db.transaction((tx) => {
			tx.delete(schema.availability).run();
			for (const [tmdbId, s] of status) {
				tx.insert(schema.availability).values({ tmdbId, status: s, syncedAt }).run();
			}
		});
		lastSync = { at: syncedAt.getTime(), count: status.size, error: null };
	} catch (e) {
		console.error('Availability sync failed', e);
		lastSync = { at: Date.now(), count: lastSync?.count ?? 0, error: String(e) };
	}
	return lastSync;
}

async function qualityProfileId(): Promise<number> {
	if (RADARR_QUALITY_PROFILE_ID) return Number(RADARR_QUALITY_PROFILE_ID);
	const profiles = await radarr<{ id: number; name: string }[]>('/qualityprofile');
	const preferred = profiles.find((p) => p.name === 'Original') ?? profiles[0];
	if (!preferred) throw new Error('Radarr has no quality profiles');
	return preferred.id;
}

/** Adds the movie to Radarr (monitored, search immediately), the same way Seerr does. */
export async function requestMovie(tmdbId: number): Promise<void> {
	if (!radarrConfigured()) throw new Error('Radarr is not configured');
	const existing = await radarr<(RadarrMovie & Record<string, unknown>)[]>(
		`/movie?tmdbId=${tmdbId}`
	);
	const known = existing[0];
	if (known && !known.hasFile) {
		// Known to Radarr but not wanted (yet): monitor it and search now.
		if (!known.monitored) {
			await radarr(`/movie/${known.id}`, {
				method: 'PUT',
				body: JSON.stringify({ ...known, monitored: true })
			});
		}
		await radarr('/command', {
			method: 'POST',
			body: JSON.stringify({ name: 'MoviesSearch', movieIds: [known.id] })
		});
	} else if (!known) {
		const lookup = await radarr<Record<string, unknown>>(`/movie/lookup/tmdb?tmdbId=${tmdbId}`);
		await radarr('/movie', {
			method: 'POST',
			body: JSON.stringify({
				...lookup,
				qualityProfileId: await qualityProfileId(),
				rootFolderPath: RADARR_ROOT_FOLDER,
				monitored: true,
				minimumAvailability: 'released',
				addOptions: { searchForMovie: true }
			})
		});
	}
	await syncAvailability();
}

export function availabilityMap(): Map<number, 'plex' | 'downloading' | 'requested'> {
	const rows = db.select().from(schema.availability).all();
	return new Map(rows.map((r) => [r.tmdbId, r.status]));
}

export function availabilityCount(): number {
	return db.get<{ n: number }>(sql`select count(*) as n from availability`)?.n ?? 0;
}
