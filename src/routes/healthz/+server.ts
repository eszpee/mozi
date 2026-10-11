import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';

export function GET() {
	db.get(sql`select 1`);
	return new Response('ok', { headers: { 'cache-control': 'no-store' } });
}
