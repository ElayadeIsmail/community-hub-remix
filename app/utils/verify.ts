import { Submission } from '@conform-to/react';
import { z } from 'zod';

export type VerifyFunctionArgs = {
	request: Request;
	submission: Submission<z.infer<typeof VerifySchema>>;
	body: FormData | URLSearchParams;
};

export const codeQueryParam = 'code';
export const targetQueryParam = 'target';
export const typeQueryParam = 'type';
export const redirectToQueryParam = 'redirectTo';
const types = ['onboarding', 'reset-password'] as const;
export const VerificationTypeSchema = z.enum(types);
export type VerificationTypes = z.infer<typeof VerificationTypeSchema>;

export const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(6).max(6),
	[typeQueryParam]: VerificationTypeSchema,
	[targetQueryParam]: z.string(),
	[redirectToQueryParam]: z.string().optional(),
});
