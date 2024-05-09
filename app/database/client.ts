import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schemas';

const client = createClient({
	url: ENV.DATABASE_URL,
});

export const db = drizzle(client, { schema });
