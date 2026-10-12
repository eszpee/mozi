import { error } from '@sveltejs/kit';
import { AVATAR_SEED } from '#lib/avatar.ts';
import { avatarSvg } from '#lib/server/avatar.ts';

export function GET({ params }) {
	if (!AVATAR_SEED.test(params.seed)) error(404, 'Nincs ilyen oldal');
	return new Response(avatarSvg(params.seed), {
		headers: {
			'content-type': 'image/svg+xml',
			'cache-control': 'public, max-age=31536000, immutable',
			'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'"
		}
	});
}
