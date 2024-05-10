import { createId } from '@paralleldrive/cuid2';
import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	username: text('username').unique().notNull(),
	email: text('email').unique().notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdateFn(() => new Date()),
});

export const usersRelations = relations(users, ({ one, many }) => ({
	password: one(passwords),
	sessions: many(sessions),
}));

export const passwords = sqliteTable('passwords', {
	hash: text('hash').notNull(),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdateFn(() => new Date()),
});

export const passwordsRelations = relations(passwords, ({ one }) => ({
	user: one(users, {
		fields: [passwords.userId],
		references: [users.id],
	}),
}));

export const sessions = sqliteTable('sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	agent: text('agent').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdateFn(() => new Date()),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const verifications = sqliteTable(
	'verifications',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		// phone, email , etc..
		type: text('type').notNull(),
		// the email or the phone number
		target: text('target').notNull(),
		// the email or the phone number
		secret: text('secret').notNull(),
		algorithm: text('algorithm').notNull(),
		digits: integer('digits').notNull(),
		period: integer('period').notNull(),
		charSet: text('char_set').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(t) => ({
		unq: unique().on(t.target, t.type),
	})
);
