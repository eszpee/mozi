/**
 * A tiny in-memory fixed-window limiter. One process serves the whole group, so
 * this is enough to blunt scripted abuse of the public endpoints.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function allow(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now();
	const entry = windows.get(key);
	if (!entry || entry.resetAt <= now) {
		windows.set(key, { count: 1, resetAt: now + windowMs });
		if (windows.size > 10_000) {
			for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
		}
		return true;
	}
	entry.count += 1;
	return entry.count <= limit;
}
