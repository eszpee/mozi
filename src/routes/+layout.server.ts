import { unreadByThread } from '#lib/server/comments.ts';

export function load({ locals, url }) {
	const user = locals.user;
	// Reading the path reruns this on every navigation, so the unread badge stays current.
	void url.pathname;
	return {
		me: user?.nickname
			? { id: user.id, nickname: user.nickname, avatarSeed: user.avatarSeed, admin: locals.admin }
			: null,
		// Threads with comments the member hasn't seen.
		unreadThreads: user?.nickname ? [...unreadByThread(user.id).keys()] : []
	};
}
