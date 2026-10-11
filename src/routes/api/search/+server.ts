import { search } from '#lib/server/search.ts';

export async function GET({ url }) {
	try {
		const hits = await search(url.searchParams.get('q') ?? '');
		return Response.json(hits, { headers: { 'cache-control': 'private, max-age=60' } });
	} catch (e) {
		console.error('Search failed', e);
		return Response.json({ error: 'Search is unavailable right now' }, { status: 502 });
	}
}
