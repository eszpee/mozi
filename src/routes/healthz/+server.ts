import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';

// Written by the image build; CI deploys and then waits for this to match its commit.
const commit = (() => {
	try {
		return readFileSync('COMMIT', 'utf8').trim();
	} catch {
		return 'dev';
	}
})();

export function GET() {
	db.get(sql`select 1`);
	return new Response('ok', { headers: { 'cache-control': 'no-store', 'x-commit': commit } });
}
