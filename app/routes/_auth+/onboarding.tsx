import { getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	redirect,
} from '@remix-run/node';
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { z } from 'zod';
import { CheckboxField, ErrorList, InputFiled } from '~/components/forms';
import { Button } from '~/components/ui';
import { db } from '~/database/client';
import { users } from '~/database/schemas';
import { useIsPending } from '~/hooks';
import { sessionKey, signup } from '~/utils/auth.server';
import { requireEmail } from '~/utils/onboarding.server';
import { sessionStorage } from '~/utils/session.server';
import {
	NameSchema,
	PasswordSchema,
	UsernameSchema,
} from '~/utils/user-validation';
import { verifySessionStorage } from '~/utils/verifySession.server';

const SignupFormSchema = z
	.object({
		username: UsernameSchema,
		name: NameSchema,
		password: PasswordSchema,
		confirmPassword: PasswordSchema,
		agreeToTermsOfServiceAndPrivacyPolicy: z.boolean({
			required_error:
				'You must agree to the terms of service and privacy policy',
		}),
		redirectTo: z.string().optional(),
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				path: ['confirmPassword'],
				code: 'custom',
				message: 'The passwords must match',
			});
		}
	});

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const email = await requireEmail(request);
	return json({ email });
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const email = await requireEmail(request);
	const formData = await request.formData();
	const agent = request.headers.get('User-Agent');
	const submission = await parseWithZod(formData, {
		schema: SignupFormSchema.superRefine(async (data, ctx) => {
			const existingUser = await db.query.users.findFirst({
				where: eq(users.username, data.username),
			});
			if (existingUser) {
				ctx.addIssue({
					path: ['username'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this username',
				});
				return;
			}
		}).transform(async (data) => {
			const session = await signup({ ...data, agent, email });
			return { session, ...data };
		}),
		async: true,
	});
	if (submission.status !== 'success') {
		return json({
			status: 'error',
			submission: submission.reply(),
		} as const);
	}
	const { session, redirectTo } = submission.value;

	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	cookieSession.set(sessionKey, session.id);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	const headers = new Headers();
	headers.append(
		'set-cookie',
		await sessionStorage.commitSession(cookieSession, {
			expires: session.expiresAt,
		})
	);
	headers.append(
		'set-cookie',
		await verifySessionStorage.destroySession(verifySession)
	);
	return redirect(safeRedirect(redirectTo), { headers });
};

const Onboarding = () => {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const isPending = useIsPending();
	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get('redirectTo');

	const [form, fields] = useForm({
		id: 'onboarding-form',
		defaultValue: { redirectTo },
		constraint: getZodConstraint(SignupFormSchema),
		lastResult: actionData?.submission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignupFormSchema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<div className='container flex min-h-full flex-col justify-center pb-32 pt-20'>
			<div className='mx-auto w-full max-w-lg'>
				<div className='flex flex-col gap-3 text-center'>
					<h1 className='text-h1'>Welcome aboard {data.email}!</h1>
					<p className='text-body-md text-muted-foreground'>
						Please enter your details.
					</p>
				</div>

				<Form method='POST' id={form.id} onSubmit={form.onSubmit}>
					<InputFiled
						labelProps={{
							children: 'username',
							htmlFor: fields.username.id,
						}}
						inputProps={{
							...getInputProps(fields.username, {
								type: 'text',
								autoFocus: true,
							}),

							className: 'lowercase',
						}}
						errors={fields.username.errors}
					/>
					<InputFiled
						labelProps={{
							children: 'name',
							htmlFor: fields.name.id,
						}}
						inputProps={{
							...getInputProps(fields.name, {
								type: 'text',
							}),
						}}
						errors={fields.name.errors}
					/>
					<InputFiled
						labelProps={{
							children: 'password',
							htmlFor: fields.password.id,
						}}
						inputProps={{
							...getInputProps(fields.password, {
								type: 'password',
							}),
							autoComplete: 'new-password',
						}}
						errors={fields.password.errors}
					/>
					<InputFiled
						labelProps={{
							children: 'Confirm Password',
							htmlFor: fields.confirmPassword.id,
						}}
						inputProps={{
							...getInputProps(fields.confirmPassword, {
								type: 'password',
							}),
							autoComplete: 'new-password',
						}}
						errors={fields.confirmPassword.errors}
					/>

					<CheckboxField
						labelProps={{
							htmlFor:
								fields.agreeToTermsOfServiceAndPrivacyPolicy.id,
							children:
								'Do you agree to our Terms of Service and Privacy Policy?',
						}}
						buttonProps={getInputProps(
							fields.agreeToTermsOfServiceAndPrivacyPolicy,
							{ type: 'checkbox' }
						)}
						errors={
							fields.agreeToTermsOfServiceAndPrivacyPolicy.errors
						}
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
				</div>
			</div>
		</div>
	);
};

export default Onboarding;
