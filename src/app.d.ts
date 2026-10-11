// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from '#lib/server/db/schema.ts';

declare global {
	/** ISO timestamp of the build, injected by Vite. */
	const __BUILD_DATE__: string;

	namespace App {
		interface Locals {
			user: User | null;
			admin: boolean;
		}
	}
}

export {};
