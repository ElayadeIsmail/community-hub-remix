import { getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json } from '@remix-run/node';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { ErrorList, OTPField } from '~/components/forms';
import { Button } from '~/components/ui';
import { db } from '~/database/client';
import { verifications } from '~/database/schemas';
import { useIsPending } from '~/hooks';
import { handleVerification as handleOnboardingVerification } from '~/utils/onboarding.server';
import {
	VerificationTypeSchema,
	VerifySchema,
	codeQueryParam,
	redirectToQueryParam,
	targetQueryParam,
	typeQueryParam,
} from '~/utils/verify';
import { isCodeValid } from '~/utils/verify.server';

async function validateRequest(
	request: Request,
	body: URLSearchParams | FormData
) {
	const submission = await parseWithZod(body, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				const codeIsValid = await isCodeValid({
					code: data[codeQueryParam],
					type: data[typeQueryParam],
					target: data[targetQueryParam],
				});
				if (!codeIsValid) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					});
					return z.NEVER;
				}
			}),

		async: true,
	});

	if (submission.status !== 'success') {
		return json({
			status: 'idle',
			submission: submission.reply(),
		} as const);
	}
	if (!submission.value) {
		return json(
			{ status: 'error', submission: submission.reply() } as const,
			{
				status: 400,
			}
		);
	}

	const { value: submissionValue } = submission;

	async function deleteVerification() {
		await db
			.delete(verifications)
			.where(
				and(
					eq(verifications.type, submissionValue[typeQueryParam]),
					eq(verifications.target, submissionValue[targetQueryParam])
				)
			);
	}

	switch (submissionValue[typeQueryParam]) {
		case 'onboarding': {
			await deleteVerification();
			return handleOnboardingVerification({ request, body, submission });
		}
	}
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	return validateRequest(request, formData);
}

const VerifyRoute = () => {
	const [searchParams] = useSearchParams();
	const isPending = useIsPending();
	const actionData = useActionData<typeof action>();
	const type = VerificationTypeSchema.parse(searchParams.get(typeQueryParam));

	const [form, fields] = useForm({
		id: 'verify-form',
		shouldValidate: 'onBlur',
		lastResult: actionData?.submission,
		defaultValue: {
			code: searchParams.get(codeQueryParam) ?? '',
			type,
			target: searchParams.get(targetQueryParam) ?? '',
			redirectTo: searchParams.get(redirectToQueryParam) ?? '',
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: VerifySchema });
		},
	});

	return (
		<div className='container flex flex-col justify-center pb-32 pt-20'>
			<div className='text-center'>
				<h1 className='text-h1'>Check your email</h1>
				<p className='mt-3 text-body-md text-muted-foreground'>
					We&lsquo;ve sent you a code to verify your email address.
				</p>
			</div>

			<div className='mx-auto flex w-72 max-w-full flex-col justify-center gap-1'>
				<div>
					<ErrorList errors={form.errors} id={form.errorId} />
				</div>
				<div className='flex w-full gap-2'>
					<Form
						method='POST'
						id={form.id}
						onSubmit={form.onSubmit}
						className='flex-1'>
						<OTPField
							labelProps={{
								htmlFor: fields[codeQueryParam].id,
								children: 'Code',
							}}
							inputProps={{
								...getInputProps(fields[codeQueryParam], {
									type: 'text',
								}),
								autoComplete: 'one-time-code',
							}}
							errors={fields[codeQueryParam].errors}
						/>
						<input
							{...getInputProps(fields[typeQueryParam], {
								type: 'hidden',
							})}
						/>
						<input
							{...getInputProps(fields[targetQueryParam], {
								type: 'hidden',
							})}
						/>
						<input
							{...getInputProps(fields[redirectToQueryParam], {
								type: 'hidden',
							})}
						/>
						<Button
							className='w-full'
							type='submit'
							disabled={isPending}>
							Submit
						</Button>
					</Form>
				</div>
			</div>
		</div>
	);
};

export default VerifyRoute;
