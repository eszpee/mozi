import { redirect } from '@sveltejs/kit';

/** The vote matrix moved to /votes when it opened up to every member. */
export function load() {
	redirect(308, '/votes');
}
