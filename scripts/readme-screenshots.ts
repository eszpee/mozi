// Takes the README screenshots (docs/*.jpg) from a dev server with a throwaway database,
// seeded with real movies and made-up members:
//   node scripts/readme-screenshots.ts
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { chromium } from '@playwright/test';
import { FIXTURE_MOVIES } from '../src/lib/server/tmdb-fixtures.ts';
import type { MovieMeta } from '../src/lib/server/db/schema.ts';

const PORT = 5175;
const BASE = `http://127.0.0.1:${PORT}`;
const DAY = 86_400_000;
const now = Date.now();

const dir = mkdtempSync(join(tmpdir(), 'mozi-shots-'));
const dbFile = join(dir, 'mozi.db');

const server = spawn(
	'npx',
	['vite', 'dev', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
	{
		env: {
			...process.env,
			DATABASE_URL: dbFile,
			DEV_LOGIN: '1',
			ADMIN_EMAILS: '',
			TMDB_TOKEN: '',
			RADARR_URL: '',
			RADARR_API_KEY: '',
			PLEX_URL: '',
			PLEX_TOKEN: '',
			SEERR_URL: '',
			SEERR_API_KEY: ''
		},
		stdio: 'ignore',
		detached: true
	}
);

async function waitFor(url: string) {
	for (let i = 0; i < 120; i++) {
		try {
			if ((await fetch(url)).ok) return;
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`${url} did not come up`);
}

const NETFLIX = { name: 'Netflix', logo: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', url: null };
const APPLE = { name: 'Apple TV', logo: '/9ghgSC0MA082EL6HLCW3GalykFD.jpg', url: null };
const GOOGLE = { name: 'Google Play Movies', logo: '/8z7rC8uIDaTM91X0ZfkRf04ydj2.jpg', url: null };

const person = (name: string) => ({ name, tmdbId: null, imdbId: null });
const release = (date: string, countries: string[], hu: string | null = null) => ({
	v: 2,
	theatrical: { date, countries, hu },
	home: null as string | null
});

function fixture(tmdbId: number, extra: Partial<MovieMeta>): { tmdbId: number; meta: MovieMeta } {
	const f = FIXTURE_MOVIES.find((m) => m.tmdbId === tmdbId)!;
	return { tmdbId, meta: { ...f.meta, ...extra } };
}

function extra(
	tmdbId: number,
	meta: Omit<MovieMeta, 'imdbId' | 'trailerKey' | 'overview' | 'genres'> & Partial<MovieMeta>
): { tmdbId: number; meta: MovieMeta } {
	return {
		tmdbId,
		meta: { imdbId: null, trailerKey: null, overview: '', genres: [], ...meta }
	};
}

const MOVIES = [
	fixture(27205, {
		releaseDate: '2010-07-15',
		releases: { ...release('2010-07-15', ['US'], '2010-07-22'), home: '2010-12-03' },
		overview:
			'Dom Cobb kiváló tolvaj: az álmok mélyéről lopja el az emberek legféltettebb titkait, amikor az elme a legsebezhetőbb. Most egy utolsó megbízást kap, amellyel visszakaphatná régi életét – ezúttal azonban nem ellopnia kell egy gondolatot, hanem elültetnie. Ez az eredet.'
	}),
	fixture(693134, {
		releaseDate: '2024-02-27',
		releases: { ...release('2024-02-29', ['HU', 'DE']), home: '2024-04-16' },
		watch: { link: null, stream: [], rent: [APPLE, GOOGLE] }
	}),
	fixture(194, {
		releaseDate: '2001-04-25',
		releases: { ...release('2001-04-25', ['FR'], '2001-11-15'), home: '2001-10-03' }
	}),
	fixture(5204, {
		releaseDate: '2003-11-20',
		releases: { ...release('2003-11-20', ['HU']), home: '2004-05-01' }
	}),
	fixture(389, {
		releaseDate: '1957-04-10',
		releases: { ...release('1957-04-10', ['US']), home: '1999-03-23' }
	}),
	fixture(336050, {
		releaseDate: '2015-06-11',
		releases: { ...release('2015-06-11', ['HU']), home: '2016-01-26' }
	}),
	extra(496243, {
		title: 'Parasite',
		originalTitle: '기생충',
		originalLanguage: 'ko',
		huTitle: 'Élősködők',
		year: 2019,
		releaseDate: '2019-05-30',
		runtime: 133,
		posterPath: '/kIvu99VgwSikNBVzcfGTF837rHc.jpg',
		rating: 8.5,
		directors: [person('Bong Joon-ho')],
		cast: [person('Song Kang-ho'), person('Lee Sun-kyun'), person('Cho Yeo-jeong')],
		watch: { link: null, stream: [], rent: [APPLE] },
		ageRating: 16,
		releases: { ...release('2019-05-30', ['KR'], '2019-09-26'), home: '2019-10-08' }
	}),
	extra(120467, {
		title: 'The Grand Budapest Hotel',
		originalTitle: 'The Grand Budapest Hotel',
		originalLanguage: 'en',
		huTitle: 'A Grand Budapest Hotel',
		year: 2014,
		releaseDate: '2014-02-26',
		runtime: 100,
		posterPath: '/fEHXKrdNjtf5R7YAA0ssVZLJLOa.jpg',
		rating: 8.0,
		directors: [person('Wes Anderson')],
		cast: [person('Ralph Fiennes'), person('Tony Revolori'), person('F. Murray Abraham')],
		watch: { link: null, stream: [], rent: [] },
		ageRating: 12,
		releases: { ...release('2014-03-07', ['US'], '2014-03-20'), home: '2014-06-17' }
	}),
	extra(129, {
		title: 'Spirited Away',
		originalTitle: '千と千尋の神隠し',
		originalLanguage: 'ja',
		huTitle: 'Chihiro szellemországban',
		year: 2001,
		releaseDate: '2001-07-20',
		runtime: 125,
		posterPath: '/2bZSC3KJcVLLTE9beTI21Nd0v6E.jpg',
		rating: 8.5,
		directors: [person('Hayao Miyazaki')],
		cast: [person('Rumi Hiiragi'), person('Miyu Irino'), person('Mari Natsuki')],
		watch: { link: null, stream: [NETFLIX], rent: [] },
		ageRating: 6,
		releases: { ...release('2001-07-20', ['JP'], '2004-03-18'), home: '2002-07-19' }
	}),
	extra(666277, {
		title: 'Past Lives',
		originalTitle: 'Past Lives',
		originalLanguage: 'en',
		huTitle: 'Előző életek',
		year: 2023,
		releaseDate: '2023-06-02',
		runtime: 106,
		posterPath: '/xJs55vGtp9SJ90PYpKomnjYEyrr.jpg',
		rating: 7.8,
		directors: [person('Celine Song')],
		cast: [person('Greta Lee'), person('Teo Yoo'), person('John Magaro')],
		watch: { link: null, stream: [], rent: [] },
		ageRating: 12,
		releases: { ...release('2023-06-02', ['US'], '2023-08-31'), home: '2023-07-21' }
	}),
	extra(545611, {
		title: 'Everything Everywhere All at Once',
		originalTitle: 'Everything Everywhere All at Once',
		originalLanguage: 'en',
		huTitle: 'Minden, mindenhol, mindenkor',
		year: 2022,
		releaseDate: '2022-03-24',
		runtime: 140,
		posterPath: '/4nbQhDoKMvNwuEkjE3MSnpoTdBP.jpg',
		rating: 7.8,
		directors: [person('Daniel Kwan'), person('Daniel Scheinert')],
		cast: [person('Michelle Yeoh'), person('Ke Huy Quan'), person('Stephanie Hsu')],
		watch: { link: null, stream: [], rent: [] },
		ageRating: 16,
		releases: { ...release('2022-03-25', ['US'], '2022-05-05'), home: '2022-06-07' }
	}),
	extra(1170608, {
		title: 'Dune: Part Three',
		originalTitle: 'Dune: Part Three',
		originalLanguage: 'en',
		huTitle: 'Dűne: Harmadik rész',
		year: 2026,
		releaseDate: '2026-12-16',
		runtime: null,
		posterPath: '/RfEMsWRoYuqgZpHtGt9k5iU9nm.jpg',
		rating: null,
		directors: [person('Denis Villeneuve')],
		cast: [person('Timothée Chalamet'), person('Zendaya'), person('Robert Pattinson')],
		watch: { link: null, stream: [], rent: [] },
		ageRating: null,
		releases: { ...release('2026-12-16', ['FR'], '2026-12-17'), home: '2027-03-02' }
	})
];

// Made-up members, nothing like the real group.
const MEMBERS = ['Mókus', 'Bagoly', 'Süni', 'Vakond', 'Pocok', 'Rozsomák'];
const SLUGS = ['mokus', 'bagoly', 'suni', 'vakond', 'pocok', 'rozsomak'];

// Votes per movie, in MEMBERS order: 1 👍, 0 🤷, -1 👎, null none. The first member is "me".
const VOTES: Record<number, (number | null)[]> = {
	27205: [1, 1, 1, 0, 1, null],
	693134: [1, 1, 0, 1, -1, 1],
	194: [null, 0, 1, 1, null, 0],
	5204: [1, 0, 1, null, 1, 1],
	389: [0, 1, null, 1, 0, null],
	336050: [-1, 0, 1, -1, null, 1],
	496243: [1, 1, 1, 1, 0, 1],
	120467: [null, 1, 0, null, 1, 0],
	129: [1, null, 1, 0, 1, null],
	666277: [0, -1, 1, null, 1, -1],
	545611: [null, 1, -1, 1, null, 0],
	1170608: [1, 1, null, 1, 1, null]
};

const ADDED_BY: Record<number, number> = {
	27205: 1,
	693134: 3,
	194: 2,
	5204: 4,
	389: 5,
	336050: 2,
	496243: 0,
	120467: 5,
	129: 2,
	666277: 3,
	545611: 1,
	1170608: 0
};

const SEEN: Record<number, number[]> = {
	27205: [3, 5],
	693134: [4],
	389: [1, 2, 3],
	496243: [5],
	129: [0, 3]
};

const AVAILABILITY: Record<number, string> = {
	27205: 'plex',
	5204: 'plex',
	496243: 'plex',
	120467: 'downloading',
	666277: 'requested',
	1170608: 'waiting'
};

const COMMENTS: [number, number, string, number][] = [
	[27205, 1, 'Ezt mindenképp moziméretben kéne, a hangja miatt is. Hozok hangfalat.', 3],
	[27205, 3, 'Láttam már kétszer, de bármikor jöhet. A forgó folyosós jelenetért megéri.', 2.6],
	[27205, 5, 'Én is láttam, de szívesen megnézem újra, most hátha a végét is értem 😅', 2.2],
	[27205, 2, 'Benne vagyok! Pénteken jó?', 0.4],
	[693134, 4, 'Az első részt ki kell hozzá vágni előtte, vagy elég egy összefoglaló?', 5],
	[496243, 0, 'Ezt mindenki dicséri, én még mindig nem láttam.', 4],
	[5204, 4, 'Bulcsú forever. A metrós futás miatt kötelező.', 1]
];

function seed() {
	const db = new Database(dbFile);
	const users = MEMBERS.map((nickname, i) =>
		Number(
			db
				.prepare(
					`insert into users (google_sub, email, nickname, avatar_seed, created_at)
					 values (?, ?, ?, ?, ?)`
				)
				.run(
					`dev-${SLUGS[i]}`,
					`${SLUGS[i]}@dev.local`,
					nickname,
					`readme-${SLUGS[i]}`,
					now - 90 * DAY
				).lastInsertRowid
		)
	);

	const movieIds = new Map<number, number>();
	MOVIES.forEach((m, i) => {
		const id = db
			.prepare(
				`insert into movies (tmdb_id, meta, meta_refreshed_at, added_by, added_at)
				 values (?, ?, ?, ?, ?)`
			)
			.run(
				m.tmdbId,
				JSON.stringify(m.meta),
				now,
				users[ADDED_BY[m.tmdbId]],
				now - (i + 1) * 2 * DAY
			).lastInsertRowid;
		movieIds.set(m.tmdbId, Number(id));
	});

	for (const [tmdbId, votes] of Object.entries(VOTES)) {
		votes.forEach((v, i) => {
			if (v === null) return;
			db.prepare('insert into votes (user_id, movie_id, value) values (?, ?, ?)').run(
				users[i],
				movieIds.get(Number(tmdbId)),
				v
			);
		});
	}
	for (const [tmdbId, who] of Object.entries(SEEN)) {
		for (const i of who) {
			db.prepare(`insert into seen (user_id, movie_id, source) values (?, ?, 'self')`).run(
				users[i],
				movieIds.get(Number(tmdbId))
			);
		}
	}
	for (const [tmdbId, status] of Object.entries(AVAILABILITY)) {
		db.prepare('insert or replace into availability (tmdb_id, status) values (?, ?)').run(
			Number(tmdbId),
			status
		);
	}
	for (const [tmdbId, who, body, daysAgo] of COMMENTS) {
		db.prepare(
			'insert into comments (movie_id, user_id, body, created_at) values (?, ?, ?, ?)'
		).run(movieIds.get(tmdbId), users[who], body, now - daysAgo * DAY);
	}

	db.prepare('delete from night_attendees').run();
	db.prepare('delete from nights').run();
	const night = db
		.prepare('insert into nights (label, date) values (?, ?)')
		.run('Péntek esti mozi', new Date(now + 3 * DAY).toISOString().slice(0, 10)).lastInsertRowid;
	for (const i of [0, 1, 2, 4]) {
		db.prepare('insert into night_attendees (night_id, user_id) values (?, ?)').run(
			night,
			users[i]
		);
	}
	db.close();
}

async function shoot() {
	const browser = await chromium.launch();
	const page = await browser.newPage({
		viewport: { width: 1280, height: 1160 },
		deviceScaleFactor: 2,
		colorScheme: 'light'
	});
	await page.goto(`${BASE}/dev/login?as=mokus`);
	await page.goto(`${BASE}/`);
	await settle(page);
	await page.screenshot({ path: 'docs/screenshot-movies.jpg', quality: 85 });

	// The movie page shows off the dark theme.
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.getByRole('link', { name: 'Inception' }).first().click();
	await page.waitForURL(/\/movie\//);
	await settle(page);
	// Cut the empty space the layout leaves below the footer.
	const height = await page.evaluate(
		() => document.querySelector('footer')!.getBoundingClientRect().bottom + 24
	);
	await page.screenshot({
		path: 'docs/screenshot-movie.jpg',
		quality: 85,
		fullPage: true,
		clip: { x: 0, y: 0, width: 1280, height }
	});
	await browser.close();
}

async function settle(page: import('@playwright/test').Page) {
	await page.waitForLoadState('networkidle');
	await page.evaluate(() =>
		Promise.all([...document.images].map((i) => i.decode().catch(() => undefined)))
	);
}

try {
	await waitFor(`${BASE}/login`);
	// The first availability sync (5 s after boot) empties the table; seed after it.
	await new Promise((r) => setTimeout(r, 7_000));
	seed();
	await shoot();
} finally {
	process.kill(-server.pid!);
	rmSync(dir, { recursive: true, force: true });
}
