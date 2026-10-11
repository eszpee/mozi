import { createHash, randomBytes } from 'node:crypto';

/** A URL-safe random token with `bytes` of entropy. */
export function generateToken(bytes = 32): string {
	return randomBytes(bytes).toString('base64url');
}

/** Tokens are stored only as their SHA-256, so a leaked database cannot be replayed as cookies. */
export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}
