import { redirect } from '@sveltejs/kit';

const MESSAGES: Record<string, string> = {
	'not-invited': 'This Google account isn’t a member yet. Ask for the invite link.',
	expired: 'That sign-in took too long. Please try again.',
	google: 'Google sign-in failed. Please try again.'
};

export function load({ locals, url }) {
	if (locals.user) redirect(303, '/');
	const error = url.searchParams.get('error');
	return { message: error ? (MESSAGES[error] ?? null) : null };
}
