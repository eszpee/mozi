import { expect, test, type Browser, type Page } from '@playwright/test';

/** Navigates and waits for hydration, so clicks hit live event handlers. */
async function go(page: Page, path: string) {
	await page.goto(path);
	await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
}

/** Signs in through the dev-only login and picks a nickname on first visit. */
async function signIn(browser: Browser, as: string, nickname: string): Promise<Page> {
	const context = await browser.newContext();
	const page = await context.newPage();
	await go(page, `/dev/login?as=${as}`);
	if (page.url().endsWith('/welcome')) {
		await page.getByLabel('Hogy hívnak?').fill(nickname);
		await page.getByRole('button', { name: 'Mehet' }).click();
	}
	await expect(page).toHaveURL('/');
	return page;
}

async function recommend(page: Page, query: string, title: RegExp) {
	await go(page, '/add');
	await page.getByRole('searchbox', { name: 'Film címe' }).fill(query);
	const hit = page.locator('.hit').filter({ hasText: title });
	await hit.getByRole('button').click();
	await expect(page).toHaveURL(/\/movie\/\d+$/);
}

const card = (page: Page, title: string) =>
	page.locator('article.movie').filter({ has: page.getByRole('heading', { name: title }) });

test.describe.serial('movie night', () => {
	let admin: Page;
	let bea: Page;

	test.beforeAll(async ({ browser }) => {
		admin = await signIn(browser, 'admin', 'Peter');
		bea = await signIn(browser, 'bea', 'Bea');
	});

	test('logged-out visitors are sent to the login page', async ({ page }) => {
		await go(page, '/');
		await expect(page).toHaveURL('/login');
		await go(page, '/join/not-a-real-token');
		await expect(page.getByRole('heading', { name: 'Lejárt link' })).toBeVisible();
	});

	test('a valid invite link welcomes new people', async ({ page }) => {
		await go(admin, '/admin');
		const link = await admin.getByLabel('Meghívólink').inputValue();
		await go(page, new URL(link).pathname);
		await expect(page.getByRole('heading', { name: /Meghívtak/ })).toBeVisible();
	});

	test('a new avatar keeps the typed nickname', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await go(page, '/dev/login?as=reroller');
		const nickname = page.getByLabel('Hogy hívnak?');
		await nickname.fill('Rolly');
		const avatar = page.locator('.avatar-row img');
		const before = await avatar.getAttribute('src');
		await page.getByRole('button', { name: /Új képet kérek/ }).click();
		await expect(avatar).not.toHaveAttribute('src', before!);
		await expect(nickname).toHaveValue('Rolly');
		const picked = await avatar.getAttribute('src');
		// Leaving without saving keeps the old avatar.
		await go(page, '/welcome');
		await expect(avatar).toHaveAttribute('src', before!);
		// Saving stores the new one.
		await page.getByRole('button', { name: /Új képet kérek/ }).click();
		const saved = await avatar.getAttribute('src');
		expect(saved).not.toBe(picked);
		await page.getByLabel('Hogy hívnak?').fill('Rolly');
		await page.getByRole('button', { name: 'Mehet' }).click();
		await expect(page).toHaveURL('/');
		await go(page, '/welcome');
		await expect(avatar).toHaveAttribute('src', saved!);
		await context.close();
	});

	test('nicknames must be unique', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await go(page, '/dev/login?as=copycat');
		await page.getByLabel('Hogy hívnak?').fill('bea');
		await page.getByRole('button', { name: 'Mehet' }).click();
		await expect(page.getByRole('alert')).toHaveText('Ezt a nevet már valaki használja');
		await context.close();
	});

	test('recommending a movie adds it with a thumbs-up', async () => {
		await go(admin, '/');
		await expect(admin.getByRole('heading', { name: 'Még nincs ajánlott film' })).toBeVisible();
		await recommend(admin, 'amel', /Amélie/);
		await expect(admin.getByRole('heading', { name: 'Amélie', level: 1 })).toBeVisible();
		await expect(admin.getByText("Le Fabuleux Destin d'Amélie Poulain")).toBeVisible();
		await expect(admin.getByRole('link', { name: 'Jean-Pierre Jeunet' })).toHaveAttribute(
			'href',
			'https://www.imdb.com/name/nm0000466/'
		);
		await expect(admin.getByRole('link', { name: 'Audrey Tautou' })).toHaveAttribute(
			'href',
			'https://www.imdb.com/name/nm0851582/'
		);
		await expect(admin.locator('.poster').getByRole('img', { name: /^Ajánlotta: / })).toBeVisible();
		await expect(admin.getByRole('button', { name: /Megnézném \(1\)/ })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await recommend(admin, 'kontroll', /Kontroll/);
		await recommend(bea, 'dune', /Dune/);
	});

	test('Hungarian films show only their Hungarian title', async () => {
		await go(admin, '/');
		const kontroll = card(admin, 'Kontroll');
		await expect(kontroll).toBeVisible();
		await expect(kontroll.locator('.original')).toHaveCount(0);
	});

	test('Hungarian films never show the English title', async () => {
		await recommend(bea, 'saul', /Saul fia/);
		await expect(bea.getByRole('heading', { name: 'Saul fia', level: 1 })).toBeVisible();
		await expect(bea.getByText('Son of Saul')).toHaveCount(0);
		// Their overview is Hungarian too.
		await expect(bea.getByText(/Auschwitz-Birkenau/)).toBeVisible();
		await bea.getByRole('button', { name: /Nekem mindegy/ }).click();
		await expect(bea.getByRole('button', { name: /Nekem mindegy \(1\)/ })).toBeVisible();
	});

	test('votes change the ranking, but cards stay put until the page reloads', async () => {
		await go(bea, '/');
		const before = await bea.locator('article.movie h3').allTextContents();
		await card(bea, 'Amélie')
			.getByRole('button', { name: /Inkább ne/ })
			.click();
		await expect(
			card(bea, 'Amélie').getByRole('button', { name: /Inkább ne \(1\)/ })
		).toBeVisible();
		await card(bea, 'Kontroll')
			.getByRole('button', { name: /Megnézném/ })
			.click();
		await expect(
			card(bea, 'Kontroll').getByRole('button', { name: /Megnézném \(2\)/ })
		).toBeVisible();
		// No jumping around while voting.
		expect(await bea.locator('article.movie h3').allTextContents()).toEqual(before);
		// The refresh button re-ranks in place.
		await bea.getByRole('button', { name: 'Frissítés' }).click();
		await expect(bea.locator('article.movie h3').first()).toHaveText('Kontroll');
		await expect(bea.locator('article.movie h3').last()).toHaveText('Amélie');

		await go(bea, '/');
		const titles = await bea.locator('article.movie h3').allTextContents();
		expect(titles[0]).toBe('Kontroll');
		expect(titles.at(-1)).toBe('Amélie');

		await go(bea, '/?sort=controversial');
		expect((await bea.locator('article.movie h3').allTextContents())[0]).toBe('Amélie');
	});

	test('"needs my vote" lists what I have not voted on', async () => {
		await go(admin, '/?needs-vote');
		await expect(admin.locator('article.movie h3')).toHaveText(['Dune: Part Two', 'Saul fia']);
	});

	test('next-night scope only counts attendees', async () => {
		await go(admin, '/');
		await admin.getByRole('button', { name: 'Peter' }).click();
		await expect(admin.getByRole('button', { name: 'Peter' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await go(admin, '/?scope=night');
		// Only Peter counts now: Bea's 👎 on Amélie no longer sinks it.
		const titles = await admin.locator('article.movie h3').allTextContents();
		expect(titles.slice(0, 2).sort()).toEqual(['Amélie', 'Kontroll']);
		// Peter voted on neither of the others; the better TMDB rating (Dune) goes first.
		expect(titles.slice(2)).toEqual(['Dune: Part Two', 'Saul fia']);
	});

	test('comments form one thread with the author’s vote', async () => {
		await go(bea, '/');
		await card(bea, 'Amélie').getByRole('link').first().click();
		await bea
			.getByLabel('Hozzászólás írása')
			.fill('Too sweet for me, see https://example.com/review');
		await bea.getByRole('button', { name: 'Küldés' }).click();
		const comment = bea.locator('.comment').first();
		await expect(comment).toContainText('Too sweet for me');
		await expect(comment).toContainText('👎');
		await expect(comment.getByRole('link', { name: 'https://example.com/review' })).toHaveAttribute(
			'rel',
			/noopener/
		);

		await go(admin, bea.url());
		await admin.getByLabel('Hozzászólás írása').fill('Fair enough');
		await admin.getByRole('button', { name: 'Küldés' }).click();
		await expect(admin.locator('.comment')).toHaveCount(2);
		await expect(admin.locator('.comment').nth(1)).toContainText('Fair enough');
	});

	test('conversations list movies by their latest comment', async () => {
		await go(bea, '/');
		await card(bea, 'Kontroll').getByRole('link').first().click();
		await bea.getByLabel('Hozzászólás írása').fill('Classic!');
		await bea.getByRole('button', { name: 'Küldés' }).click();
		await expect(bea.locator('.comment')).toHaveCount(1);

		await go(admin, '/');
		await admin.getByRole('link', { name: 'Beszélgetések' }).click();
		await expect(admin).toHaveURL('/comments');
		const items = admin.locator('.conversation');
		await expect(items).toHaveCount(2);
		await expect(items.nth(0)).toContainText('Kontroll');
		await expect(items.nth(0)).toContainText('Bea');
		await expect(items.nth(0)).toContainText('Classic!');
		await expect(items.nth(1)).toContainText('Amélie');
		await expect(items.nth(1)).toContainText('Peter');
		await expect(items.nth(1)).toContainText('Fair enough');

		await items.nth(1).click();
		await expect(admin).toHaveURL(/\/movie\/\d+#comments$/);
	});

	test('new comments count until their movie is opened', async () => {
		const badge = (page: Page) => page.locator('nav .badge');

		// Bea's "Classic!" on Kontroll is still unread for Peter; the list alone doesn't clear it.
		await go(admin, '/comments');
		await expect(badge(admin)).toHaveText('1');
		await expect(admin.locator('.conversation.unread')).toContainText('Kontroll');
		await expect(admin.locator('.conversation.unread')).toContainText('1 új');
		await go(admin, '/');
		await expect(badge(admin)).toHaveText('1');

		// Peter's "Fair enough" came after Bea last read Amélie.
		await go(bea, '/');
		await expect(badge(bea)).toHaveText('1');
		await card(bea, 'Amélie').getByRole('link').first().click();
		await expect(bea.locator('.comment').nth(1).locator('.new')).toHaveText('új');
		await expect(badge(bea)).toHaveCount(0);
		await bea.getByLabel('Hozzászólás írása').fill('Still too sweet');
		await bea.getByRole('button', { name: 'Küldés' }).click();
		await expect(bea.locator('.comment')).toHaveCount(3);
		// Her own comment is not news to her.
		await go(bea, '/');
		await expect(badge(bea)).toHaveCount(0);

		// Opening a movie straight from its card reads its thread too.
		await go(admin, '/');
		await expect(badge(admin)).toHaveText('2');
		await card(admin, 'Kontroll').getByRole('link').first().click();
		await expect(admin.locator('.comment .new')).toHaveCount(1);
		await expect(badge(admin)).toHaveText('1');
		await go(admin, '/');
		await expect(badge(admin)).toHaveText('1');

		// Phones show only the 💬 icon: the badge sits on it, inside the screen.
		await admin.setViewportSize({ width: 375, height: 812 });
		await expect(badge(admin)).toBeInViewport({ ratio: 1 });
		await expect(admin.locator('nav .nav-icon.glow')).toBeVisible();
		await admin.setViewportSize({ width: 1280, height: 720 });
	});

	test('only admins can remove movies', async () => {
		await go(bea, '/');
		await card(bea, 'Dune: Part Two').getByRole('link').first().click();
		await expect(bea).toHaveURL(/\/movie\/\d+$/);
		await expect(bea.getByRole('button', { name: 'Törlés', exact: true })).toHaveCount(0);
		await expect(bea.getByRole('button', { name: /Töltsük le/ })).toHaveCount(0);
		const res = await bea.request.post(`${bea.url()}?/remove`, {
			headers: { 'x-sveltekit-action': 'true', origin: 'http://localhost:5174' },
			form: {}
		});
		expect(await res.text()).toContain('403');
	});

	test('the vote matrix is admin-only and shows each vote', async () => {
		await go(admin, '/');
		await admin.getByLabel('Fiókmenü').click();
		await admin.getByRole('link', { name: 'Szavazatok' }).click();
		await expect(admin).toHaveURL('/admin/votes');
		const header = await admin.locator('thead th .name').allTextContents();
		const amelie = admin.locator('tbody tr').filter({ hasText: 'Amélie' });
		const cells = await amelie.locator('td').allTextContents();
		expect(cells[header.indexOf('Peter')].trim()).toBe('👍');
		expect(cells[header.indexOf('Bea')].trim()).toBe('👎');
		// Totals per row (👍 🤷 👎), zero left empty.
		expect(cells.slice(-3).map((c) => c.trim())).toEqual(['1', '', '1']);
		// Totals per column: Bea's 👎 row counts her one 👎 (Amélie).
		const beaDown = admin.locator('tfoot tr').nth(2).locator('td').nth(header.indexOf('Bea'));
		await expect(beaDown).toHaveText('1');
		await expect(amelie.getByRole('img', { name: 'Ajánlotta: Peter' })).toBeVisible();

		await go(bea, '/');
		await bea.getByLabel('Fiókmenü').click();
		await expect(bea.getByRole('link', { name: 'Szavazatok' })).toHaveCount(0);
		const res = await bea.request.get('/admin/votes');
		expect(res.status()).toBe(404);
	});

	test('watching a movie archives it, marks attendees seen and rolls the night over', async () => {
		await go(admin, '/');
		await card(admin, 'Kontroll').getByRole('link').first().click();
		await admin.getByRole('button', { name: '🎬 Megnéztük' }).click();
		await admin.getByRole('button', { name: 'Igen, megnéztük' }).click();
		await expect(admin.getByText(/Együtt néztük meg/)).toBeVisible();
		await expect(admin.locator('.seen-by')).toContainText('Peter');
		await expect(admin.getByRole('button', { name: /Megnézném/ })).toBeDisabled();

		await go(admin, '/');
		await expect(card(admin, 'Kontroll')).toHaveCount(0);
		// The new night keeps the same attendees.
		await expect(admin.getByRole('button', { name: 'Peter' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await go(admin, '/watched');
		await expect(admin.getByRole('link', { name: 'Kontroll' })).toBeVisible();
		await admin.getByRole('button', { name: '⋯' }).click();
		await admin.getByRole('button', { name: 'Visszavonás' }).click();
		await expect(admin.getByRole('link', { name: 'Kontroll' })).toHaveCount(0);
		await go(admin, '/');
		await expect(card(admin, 'Kontroll')).toBeVisible();
		await expect(card(admin, 'Kontroll').locator('.seen')).toHaveCount(0);
	});

	test('individual seen marks show on the card', async () => {
		await go(bea, '/');
		await card(bea, 'Dune: Part Two').getByRole('link').first().click();
		await bea.getByRole('button', { name: 'Már láttam' }).click();
		await expect(bea.getByRole('button', { name: '✓ Már láttam' })).toBeVisible();
		await go(bea, '/');
		await expect(card(bea, 'Dune: Part Two').locator('.seen')).toBeVisible();
	});

	test('admin can remove a movie and remove a member', async () => {
		await go(admin, '/');
		await card(admin, 'Dune: Part Two').getByRole('link').first().click();
		await admin.getByRole('button', { name: 'Törlés', exact: true }).click();
		await admin.getByRole('button', { name: 'Törlés mindenkinek' }).click();
		await expect(admin).toHaveURL('/');
		await expect(card(admin, 'Dune: Part Two')).toHaveCount(0);

		await go(admin, '/admin');
		// Bea voted and commented earlier.
		await expect(admin.locator('.members li').filter({ hasText: 'Bea' })).toContainText(
			/utolsó művelet: (épp most|\d+ perce)/
		);
		const row = admin.locator('.members li').filter({ hasText: 'Bea' });
		await row.getByRole('button', { name: '⋯' }).click();
		await row.getByRole('button', { name: 'Eltávolítás' }).click();
		await expect(row).toContainText('eltávolítva');

		// A removed member's votes leave the vote matrix and its totals (Bea's 👎 on Amélie).
		await go(admin, '/admin/votes');
		await expect(admin.locator('thead th .name')).not.toContainText(['Bea']);
		const amelie = admin.locator('tbody tr').filter({ hasText: 'Amélie' });
		expect((await amelie.locator('td').allTextContents()).slice(-3).map((c) => c.trim())).toEqual([
			'1',
			'',
			''
		]);

		await go(bea, '/');
		await expect(bea).toHaveURL('/login');
	});

	test('pages fit a phone screen without horizontal scrolling', async () => {
		await go(admin, '/');
		const movie = await card(admin, 'Amélie').getByRole('link').first().getAttribute('href');
		for (const width of [320, 375, 402, 412]) {
			await admin.setViewportSize({ width, height: 800 });
			for (const path of ['/', movie!, '/add', '/watched', '/night', '/admin', '/admin/votes']) {
				await go(admin, path);
				// Nothing may stick out to the right, even if clipped (iOS Safari pans to it).
				const sticking = await admin.evaluate(() => {
					const vw = document.documentElement.clientWidth;
					return [...document.querySelectorAll('body *')]
						.filter((e) => !e.closest('.sorts, .hero, .matrix'))
						.filter((e) => e.getBoundingClientRect().right > vw + 0.5)
						.map((e) => e.className);
				});
				expect(sticking, `${width}px ${path}`).toEqual([]);
				// iOS zooms in on fields under 16px, and the zoomed page pans sideways.
				const small = await admin.evaluate(() =>
					[...document.querySelectorAll('input:not([type=hidden], [readonly]), textarea, select')]
						.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16)
						.map((e) => e.getAttribute('name'))
				);
				expect(small, `${width}px ${path}`).toEqual([]);
			}
		}
	});
});
