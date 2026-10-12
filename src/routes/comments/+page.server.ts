import { listConversations } from '#lib/server/comments.ts';

export function load({ locals }) {
	return { conversations: listConversations(locals.user!.id) };
}
