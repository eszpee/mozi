export function load({ locals }) {
	const user = locals.user;
	return {
		me: user?.nickname
			? { id: user.id, nickname: user.nickname, avatarSeed: user.avatarSeed, admin: locals.admin }
			: null
	};
}
