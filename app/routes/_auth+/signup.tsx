import { getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	redirect,
} from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ErrorList, InputFiled } from '~/components/forms';
import { Button } from '~/components/ui';
import { db } from '~/database/client';
import { users } from '~/database/schemas';
import { useIsPending } from '~/hooks';
import { requireAnonymous } from '~/utils/auth.server';
import { prepareVerification } from '~/utils/verify.server';

const SignUpSchema = z.object({
	email: z.string().email(),
	redirectTo: z.string().optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireAnonymous(request);
	return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
		schema: SignUpSchema.superRefine(async (data, ctx) => {
			const existingUser = await db.query.users.findFirst({
				columns: { id: true },
				where: eq(users.email, data.email),
			});
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this email',
				});
				return;
			}
		}),
		async: true,
	});
	// Send the submission back to the client if the status is not successful
	if (submission.status !== 'success') {
		return json({
			submission: submission.reply(),
			status: 'error',
		} as const);
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const { email, redirectTo: postVerificationRedirectTo } = submission.value;

	const { verifyUrl, redirectTo, otp } = await prepareVerification({
		period: 10 * 60,
		request,
		type: 'onboarding',
		target: email,
		redirectTo: postVerificationRedirectTo,
	});

	console.log({
		url: verifyUrl.toString() + '\n',
		otp,
		redirect: redirectTo.toString(),
	});

	return redirect(redirectTo.toString());
	// const response = await sendEmail({
	// 	to: email,
	// 	subject: `Welcome to Community Hub!`,
	// 	react: <SignupEmail onboardingUrl={verifyUrl.toString()} otp={otp} />,
	// });

	// if (response.status === 'success') {
	// 	return redirect(redirectTo.toString());
	// } else {
	// 	return json(
	// 		{
	// 			status: 'error',
	// 			submission: submission.reply({
	// 				formErrors: [response.error.message],
	// 			}),
	// 		} as const,
	// 		{ status: 500 }
	// 	);
	// }
};

const SignUpPage = () => {
	const actionData = useActionData<typeof action>();

	const [searchParams] = useSearchParams();
	const isPending = useIsPending();
	const redirectTo = searchParams.get('redirectTo');

	const [form, fields] = useForm({
		id: 'signup-form',
		shouldValidate: 'onBlur',
		lastResult: actionData?.submission,
		defaultValue: { redirectTo },
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignUpSchema });
		},
	});

	return (
		<div className='container flex flex-col justify-center pb-32 pt-20'>
			<div className='mx-auto w-full max-w-md'>
				<div className='text-center'>
					<h1 className='text-h1'>Let&lsquo;s start your journey!</h1>
					<p className='mt-3 text-body-md text-muted-foreground'>
						Please enter your email.
					</p>
				</div>

				<div>
					<div className='mx-auto w-full max-w-md px-8'>
						<Form
							method='POST'
							id={form.id}
							onSubmit={form.onSubmit}>
							<InputFiled
								labelProps={{
									children: 'email',
									htmlFor: fields.email.id,
								}}
								inputProps={{
									...getInputProps(fields.email, {
										type: 'email',
										autoFocus: true,
									}),

									className: 'lowercase',
								}}
								errors={fields.email.errors}
							/>

							<input
								{...getInputProps(fields.redirectTo, {
									type: 'hidden',
								})}
							/>
							<ErrorList errors={form.errors} id={form.errorId} />

							<div className='flex items-center justify-between gap-6 pt-3'>
								<Button
									className='w-full'
									type='submit'
									disabled={isPending}>
									Log in
								</Button>
							</div>
						</Form>
						<div className='flex items-center justify-center gap-2 pt-6'>
							<span className='text-muted-foreground'>
								Already have an account?
							</span>
							<Link to={'/login'}>Login</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SignUpPage;
