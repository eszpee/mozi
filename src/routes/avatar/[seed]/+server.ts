import { error } from '@sveltejs/kit';
import { createAvatar } from '@dicebear/core';
import * as funEmoji from '@dicebear/fun-emoji';

export function GET({ params }) {
	if (!/^[A-Za-z0-9_-]{1,32}$/.test(params.seed)) error(404, 'Not found');
	const svg = createAvatar(funEmoji, { seed: params.seed, radius: 50 }).toString();
	return new Response(svg, {
		headers: {
			'content-type': 'image/svg+xml',
			'cache-control': 'public, max-age=31536000, immutable',
			'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'"
		}
	});
}
