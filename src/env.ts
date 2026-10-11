import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value ?? '';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Path of the SQLite database file.',
		schema: (value) => value || 'data/mozi.db'
	},
	GOOGLE_CLIENT_ID: { description: 'Google OAuth web client id.', schema: optional },
	GOOGLE_CLIENT_SECRET: { description: 'Google OAuth web client secret.', schema: optional },
	ADMIN_EMAILS: {
		description: 'Comma-separated Google emails with admin rights.',
		schema: optional
	},
	TMDB_TOKEN: { description: 'TMDB API read access token (v4 bearer).', schema: optional },
	RADARR_URL: {
		description: 'Radarr base URL, e.g. http://radarr.example:7878.',
		schema: optional
	},
	RADARR_API_KEY: { description: 'Radarr API key.', schema: optional },
	RADARR_QUALITY_PROFILE_ID: {
		description: 'Radarr quality profile id used for requests.',
		schema: optional
	},
	RADARR_ROOT_FOLDER: {
		description: 'Radarr root folder for requests.',
		schema: (value) => value ?? '/data/hdd-media/movies'
	},
	PLEX_URL: { description: 'Plex base URL, e.g. http://plex.example:32400.', schema: optional },
	PLEX_TOKEN: { description: 'Plex token.', schema: optional },
	DEV_LOGIN: {
		description: 'Development only: enables /dev/login to sign in without Google.',
		schema: optional
	}
});
