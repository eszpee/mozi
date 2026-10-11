import { redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { DEV_LOGIN } from '$app/env/private';

const MESSAGES: Record<string, string> = {
	'not-invited': 'Ez a Google-fiók még nem tag. Kérd el a meghívólinket.',
	expired: 'A belépés túl sokáig tartott. Próbáld újra.',
	google: 'A Google-belépés nem sikerült. Próbáld újra.'
};

export function load({ locals, url }) {
	if (locals.user) redirect(303, '/');
	const error = url.searchParams.get('error');
	return {
		message: error ? (MESSAGES[error] ?? null) : null,
		devLogin: dev && DEV_LOGIN === '1'
	};
}
