import { createHash } from 'node:crypto';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$app/env/private';
import { generateToken } from './tokens.ts';

export const STATE_COOKIE = 'mozi_oauth_state';
export const VERIFIER_COOKIE = 'mozi_oauth_verifier';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

function config() {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new Error('Google OAuth is not configured');
	return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET };
}

const redirectUri = (origin: string) => `${origin}/auth/google/callback`;

/** Authorization-code flow with PKCE (S256) and a state parameter. */
export function startGoogleLogin(origin: string) {
	const state = generateToken();
	const verifier = generateToken();
	const challenge = createHash('sha256').update(verifier).digest('base64url');

	const url = new URL(AUTH_ENDPOINT);
	url.search = new URLSearchParams({
		client_id: config().clientId,
		redirect_uri: redirectUri(origin),
		response_type: 'code',
		scope: 'openid email profile',
		state,
		code_challenge: challenge,
		code_challenge_method: 'S256',
		prompt: 'select_account'
	}).toString();
	return { url, state, verifier };
}

export type GoogleIdentity = { sub: string; email: string };

/**
 * Exchanges the code for tokens. The ID token comes straight from Google's token
 * endpoint over TLS, authenticated with our client secret, so its claims can be
 * trusted without verifying the signature (OIDC Core §3.1.3.7). Audience, issuer,
 * expiry and email verification are still checked.
 */
export async function finishGoogleLogin(
	origin: string,
	code: string,
	verifier: string
): Promise<GoogleIdentity> {
	const { clientId, clientSecret } = config();
	const res = await fetch(TOKEN_ENDPOINT, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			code_verifier: verifier,
			redirect_uri: redirectUri(origin),
			client_id: clientId,
			client_secret: clientSecret
		})
	});
	if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
	const { id_token } = (await res.json()) as { id_token?: string };
	if (!id_token) throw new Error('No ID token in token response');

	return identityFromIdToken(id_token, clientId);
}

export function identityFromIdToken(idToken: string, clientId: string, now = Date.now()) {
	const payload = idToken.split('.')[1];
	if (!payload) throw new Error('Malformed ID token');
	const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<
		string,
		unknown
	>;

	const issuerOk =
		claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
	if (!issuerOk || claims.aud !== clientId) throw new Error('ID token not issued for this app');
	if (typeof claims.exp !== 'number' || claims.exp * 1000 < now)
		throw new Error('ID token expired');
	if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
		throw new Error('ID token without identity');
	}
	if (claims.email_verified !== true) throw new Error('Google email is not verified');

	return { sub: claims.sub, email: claims.email.toLowerCase() };
}
