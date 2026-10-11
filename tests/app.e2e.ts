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
		await page.getByLabel('What should the crew call you?').fill(nickname);
		await page.getByRole('button', { name: 'Let’s go' }).click();
	}
	await expect(page).toHaveURL('/');
	return page;
}

async function recommend(page: Page, query: string, title: RegExp) {
	await go(page, '/add');
	await page.getByRole('searchbox', { name: 'Movie title' }).fill(query);
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
		await expect(page.getByRole('heading', { name: 'Link expired' })).toBeVisible();
	});

	test('a valid invite link welcomes new people', async ({ page }) => {
		await go(admin, '/admin');
		const link = await admin.getByLabel('Invite link').inputValue();
		await go(page, new URL(link).pathname);
		await expect(page.getByRole('heading', { name: /You’re invited/ })).toBeVisible();
	});

	test('nicknames must be unique', async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await go(page, '/dev/login?as=copycat');
		await page.getByLabel('What should the crew call you?').fill('bea');
		await page.getByRole('button', { name: 'Let’s go' }).click();
		await expect(page.getByRole('alert')).toHaveText('Someone already goes by that name');
		await context.close();
	});

	test('recommending a movie adds it with a thumbs-up', async () => {
		await go(admin, '/');
		await expect(admin.getByRole('heading', { name: 'No picks yet' })).toBeVisible();
		await recommend(admin, 'amel', /Amélie/);
		await expect(admin.getByRole('heading', { name: 'Amélie', level: 1 })).toBeVisible();
		await expect(admin.getByText("Le Fabuleux Destin d'Amélie Poulain")).toBeVisible();
		await expect(admin.getByRole('button', { name: /Want to watch \(1\)/ })).toHaveAttribute(
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
		await bea.getByRole('button', { name: /Fine either way/ }).click();
		await expect(bea.getByRole('button', { name: /Fine either way \(1\)/ })).toBeVisible();
	});

	test('votes change the ranking', async () => {
		await go(bea, '/');
		await card(bea, 'Amélie')
			.getByRole('button', { name: /Please no/ })
			.click();
		await expect(
			card(bea, 'Amélie').getByRole('button', { name: /Please no \(1\)/ })
		).toBeVisible();
		await card(bea, 'Kontroll')
			.getByRole('button', { name: /Want to watch/ })
			.click();
		await expect(
			card(bea, 'Kontroll').getByRole('button', { name: /Want to watch \(2\)/ })
		).toBeVisible();

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
		expect(titles.at(-1)).toBe('Dune: Part Two');
	});

	test('comments form one thread with the author’s vote', async () => {
		await go(bea, '/');
		await card(bea, 'Amélie').getByRole('link').first().click();
		await bea.getByLabel('Add a comment').fill('Too sweet for me, see https://example.com/review');
		await bea.getByRole('button', { name: 'Post' }).click();
		const comment = bea.locator('.comment').first();
		await expect(comment).toContainText('Too sweet for me');
		await expect(comment).toContainText('👎');
		await expect(comment.getByRole('link', { name: 'https://example.com/review' })).toHaveAttribute(
			'rel',
			/noopener/
		);

		await go(admin, bea.url());
		await admin.getByLabel('Add a comment').fill('Fair enough');
		await admin.getByRole('button', { name: 'Post' }).click();
		await expect(admin.locator('.comment')).toHaveCount(2);
		await expect(admin.locator('.comment').nth(1)).toContainText('Fair enough');
	});

	test('only admins can remove movies', async () => {
		await go(bea, '/');
		await card(bea, 'Dune: Part Two').getByRole('link').first().click();
		await expect(bea).toHaveURL(/\/movie\/\d+$/);
		await expect(bea.getByRole('button', { name: 'Remove' })).toHaveCount(0);
		await expect(bea.getByRole('button', { name: /Request in Radarr/ })).toHaveCount(0);
		const res = await bea.request.post(`${bea.url()}?/remove`, {
			headers: { 'x-sveltekit-action': 'true', origin: 'http://localhost:5174' },
			form: {}
		});
		expect(await res.text()).toContain('403');
	});

	test('watching a movie archives it, marks attendees seen and rolls the night over', async () => {
		await go(admin, '/');
		await card(admin, 'Kontroll').getByRole('link').first().click();
		await admin.getByRole('button', { name: '🎬 We watched it' }).click();
		await admin.getByRole('button', { name: 'Yes, we watched it' }).click();
		await expect(admin.getByText(/Watched together on/)).toBeVisible();
		await expect(admin.locator('.seen-by')).toContainText('Peter');
		await expect(admin.getByRole('button', { name: /Want to watch/ })).toBeDisabled();

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
		await admin.getByRole('button', { name: 'Undo' }).click();
		await expect(admin.getByRole('link', { name: 'Kontroll' })).toHaveCount(0);
		await go(admin, '/');
		await expect(card(admin, 'Kontroll')).toBeVisible();
		await expect(card(admin, 'Kontroll').locator('.seen')).toHaveCount(0);
	});

	test('individual seen marks show on the card', async () => {
		await go(bea, '/');
		await card(bea, 'Dune: Part Two').getByRole('link').first().click();
		await bea.getByRole('button', { name: 'I’ve seen it' }).click();
		await expect(bea.getByRole('button', { name: '✓ I’ve seen it' })).toBeVisible();
		await go(bea, '/');
		await expect(card(bea, 'Dune: Part Two').locator('.seen')).toBeVisible();
	});

	test('admin can remove a movie and remove a member', async () => {
		await go(admin, '/');
		await card(admin, 'Dune: Part Two').getByRole('link').first().click();
		await admin.getByRole('button', { name: 'Remove' }).click();
		await admin.getByRole('button', { name: 'Remove for everyone' }).click();
		await expect(admin).toHaveURL('/');
		await expect(card(admin, 'Dune: Part Two')).toHaveCount(0);

		await go(admin, '/admin');
		const row = admin.locator('.members li').filter({ hasText: 'Bea' });
		await row.getByRole('button', { name: '⋯' }).click();
		await row.getByRole('button', { name: 'Remove' }).click();
		await expect(row).toContainText('removed');

		await go(bea, '/');
		await expect(bea).toHaveURL('/login');
	});

	test('pages fit a phone screen without horizontal scrolling', async () => {
		for (const path of ['/', '/add', '/watched', '/night', '/admin']) {
			await go(admin, path);
			const overflow = await admin.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			);
			expect(overflow, path).toBeLessThanOrEqual(0);
		}
	});
});
