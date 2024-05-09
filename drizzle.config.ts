import { defineConfig } from 'drizzle-kit';
import { getEnv } from '~/utils/env.server';

const { DATABASE_URL } = getEnv();

export default defineConfig({
	schema: './app/database/schemas/**/*.ts',
	out: './drizzle',
	driver: 'turso',
	dbCredentials: { url: DATABASE_URL },
	dialect: 'sqlite',
});
