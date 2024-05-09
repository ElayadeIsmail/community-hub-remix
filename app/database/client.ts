import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const client = createClient({
	url: ENV.DATABASE_URL,
});

export const db = drizzle(client);