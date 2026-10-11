import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env/private', () => ({ GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'secret' }));

const { identityFromIdToken, startGoogleLogin } = await import('./google.ts');

const token = (claims: Record<string, unknown>) =>
	['e30', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'sig'].join('.');

const good = {
	iss: 'https://accounts.google.com',
	aud: 'cid',
	exp: 2_000_000_000,
	sub: '123',
	email: 'Anna@Gmail.com',
	email_verified: true
};

describe('identityFromIdToken', () => {
	it('returns the subject and lower-cased email', () => {
		expect(identityFromIdToken(token(good), 'cid', 0)).toEqual({
			sub: '123',
			email: 'anna@gmail.com'
		});
	});

	it.each([
		['wrong audience', { aud: 'other' }],
		['wrong issuer', { iss: 'https://evil.example' }],
		['expired', { exp: 1 }],
		['unverified email', { email_verified: false }],
		['missing subject', { sub: undefined }]
	])('rejects %s', (_, override) => {
		expect(() => identityFromIdToken(token({ ...good, ...override }), 'cid', 10_000)).toThrow();
	});
});

describe('startGoogleLogin', () => {
	it('builds a PKCE authorization URL with state', () => {
		const { url, state } = startGoogleLogin('https://mozi.example');
		expect(url.origin).toBe('https://accounts.google.com');
		expect(url.searchParams.get('redirect_uri')).toBe('https://mozi.example/auth/google/callback');
		expect(url.searchParams.get('code_challenge_method')).toBe('S256');
		expect(url.searchParams.get('state')).toBe(state);
	});
});
