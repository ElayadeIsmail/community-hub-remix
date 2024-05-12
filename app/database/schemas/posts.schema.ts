import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const topics = sqliteTable('topics', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text('name').unique().notNull(),
	slug: text('slug').unique().notNull(),
});

export const topicsRelations = relations(topics, ({ many }) => ({
	communitiesToTopics: many(communitiesToTopics),
}));

export const communities = sqliteTable('communities', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text('name').unique().notNull(),
	slug: text('slug').unique().notNull(),
});

export const communitiesRelations = relations(communities, ({ many }) => ({
	communitiesToTopics: many(communitiesToTopics),
}));

export const communitiesToTopics = sqliteTable(
	'community_to_topic',
	{
		communityId: text('community_id')
			.notNull()
			.references(() => communities.id),
		topicId: text('topic_id')
			.notNull()
			.references(() => topics.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.communityId, t.topicId] }),
	})
);

export const communitiesToTopicsRelations = relations(
	communitiesToTopics,
	({ one }) => ({
		community: one(communities, {
			fields: [communitiesToTopics.communityId],
			references: [communities.id],
		}),
		topic: one(topics, {
			fields: [communitiesToTopics.topicId],
			references: [topics.id],
		}),
	})
);
