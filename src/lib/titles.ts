export type TitleSource = {
	title: string;
	originalTitle: string;
	originalLanguage: string;
	huTitle: string | null;
};

export type DisplayTitle = { main: string; original: string | null };

const normalize = (s: string) => s.trim().toLocaleLowerCase();

/**
 * Hungarian films show only their Hungarian title; everything else shows the
 * English title, with the original in parentheses when it differs.
 */
export function displayTitle(m: TitleSource): DisplayTitle {
	if (m.originalLanguage === 'hu') {
		return { main: m.huTitle?.trim() || m.originalTitle || m.title, original: null };
	}
	const original =
		m.originalTitle && normalize(m.originalTitle) !== normalize(m.title) ? m.originalTitle : null;
	return { main: m.title, original };
}
