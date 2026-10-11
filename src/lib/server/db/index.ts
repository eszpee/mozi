import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';
import { building } from '$app/env';
import { DATABASE_URL } from '$app/env/private';

// The build analyses server modules; it must not create or migrate the real database.
const file = building ? ':memory:' : DATABASE_URL;
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });

const client = new Database(file);
client.pragma('journal_mode = WAL');
client.pragma('foreign_keys = ON');
client.pragma('busy_timeout = 5000');

export const db = drizzle(client, { schema });

// Migrations ship with the image (./drizzle) and run once at startup.
migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? 'drizzle' });

export { schema };
