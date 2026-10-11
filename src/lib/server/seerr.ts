import { SEERR_API_KEY, SEERR_URL } from '$app/env/private';
import { markRequested, syncAvailability } from './arr.ts';

export const seerrConfigured = () => !!(SEERR_URL && SEERR_API_KEY);

/**
 * Requests the movie in Seerr, which hands it to Radarr with its own defaults.
 * One call per admin click, so it stays far from Seerr's rate limits.
 */
export async function requestInSeerr(tmdbId: number): Promise<void> {
	if (!seerrConfigured()) throw new Error('Seerr is not configured');
	const res = await fetch(`${SEERR_URL}/api/v1/request`, {
		method: 'POST',
		headers: { 'x-api-key': SEERR_API_KEY, 'content-type': 'application/json' },
		body: JSON.stringify({ mediaType: 'movie', mediaId: tmdbId }),
		signal: AbortSignal.timeout(15_000)
	});
	// 409: already requested, which is what we wanted anyway.
	if (!res.ok && res.status !== 409) {
		throw new Error(`Seerr request: ${res.status} ${await res.text()}`);
	}
	// Seerr adds it to Radarr asynchronously, so a sync right now would not see it yet.
	markRequested(tmdbId);
	setTimeout(() => void syncAvailability(), 15_000);
}
