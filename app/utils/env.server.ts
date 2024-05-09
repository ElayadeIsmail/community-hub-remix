import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string(),
});

export const getEnv = () => {
	const result = envSchema.safeParse(process.env);
	if (!result.success) {
		throw new Error(
			`Error Parsing Env variables ${result.error.flatten().formErrors}`
		);
	}
	return result.data;
};

declare global {
	// eslint-disable-next-line no-var
	var ENV: ReturnType<typeof getEnv>;
}
