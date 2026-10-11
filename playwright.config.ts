import { defineConfig, devices } from '@playwright/test';

const PORT = 5174;

// E2E runs against the dev server with a throwaway database, the built-in TMDB
// fixture catalog and no Plex/Radarr, so it never touches real services.
export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: `http://localhost:${PORT}`,
		...devices['Pixel 7']
	},
	webServer: {
		command: `rm -rf .e2e-data && vite dev --port ${PORT} --strictPort`,
		port: PORT,
		reuseExistingServer: false,
		env: {
			DATABASE_URL: '.e2e-data/mozi.db',
			DEV_LOGIN: '1',
			ADMIN_EMAILS: 'admin@dev.local',
			TMDB_TOKEN: '',
			RADARR_URL: '',
			RADARR_API_KEY: '',
			PLEX_URL: '',
			PLEX_TOKEN: ''
		}
	}
});
