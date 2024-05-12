import { createClient } from '@libsql/client';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { topics } from './schemas/posts.schema';

if (!process.env.DATABASE_URL) {
	throw new Error(`DATABASE_URL must be defined`);
}

const client = createClient({
	url: process.env.DATABASE_URL,
});

const db = drizzle(client);

const topics_data = [
	{
		name: 'Technology',
		slug: 'technology',
	},
	{
		name: 'Science',
		slug: 'science',
	},
	{
		name: 'Programming',
		slug: 'programming',
	},
	{
		name: 'Gaming',
		slug: 'gaming',
	},
	{
		name: 'Movies',
		slug: 'movies',
	},
	{
		name: 'TV Shows',
		slug: 'tv-shows',
	},
	{
		name: 'Music',
		slug: 'music',
	},
	{
		name: 'Books',
		slug: 'books',
	},
	{
		name: 'Sports',
		slug: 'sports',
	},
	{
		name: 'Fitness',
		slug: 'fitness',
	},
	{
		name: 'Health',
		slug: 'health',
	},
	{
		name: 'Cooking',
		slug: 'cooking',
	},
	{
		name: 'Travel',
		slug: 'travel',
	},
	{
		name: 'History',
		slug: 'history',
	},
	{
		name: 'Art',
		slug: 'art',
	},
	{
		name: 'Photography',
		slug: 'photography',
	},
	{
		name: 'Fashion',
		slug: 'fashion',
	},
	{
		name: 'Writing',
		slug: 'writing',
	},
	{
		name: 'DIY (Do It Yourself)',
		slug: 'diy',
	},
	{
		name: 'Nature',
		slug: 'nature',
	},
	{
		name: 'Animals',
		slug: 'animals',
	},
	{
		name: 'Politics',
		slug: 'politics',
	},
	{
		name: 'News',
		slug: 'news',
	},
	{
		name: 'Philosophy',
		slug: 'philosophy',
	},
	{
		name: 'Psychology',
		slug: 'psychology',
	},
	{
		name: 'Finance',
		slug: 'finance',
	},
	{
		name: 'Education',
		slug: 'education',
	},
	{
		name: 'Relationships',
		slug: 'relationships',
	},
	{
		name: 'Parenting',
		slug: 'parenting',
	},
	{
		name: 'Memes',
		slug: 'memes',
	},
];

const main = async () => {
	console.log('Cleaning Database');
	await db.delete(topics).all();
	console.log('Inserting Data Database');
	await db.insert(topics).values(topics_data);
};

main();
