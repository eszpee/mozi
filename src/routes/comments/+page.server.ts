import { listConversations } from '#lib/server/comments.ts';

export function load() {
	return { conversations: listConversations() };
}
