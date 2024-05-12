import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, Link, useActionData } from '@remix-run/react';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { z } from 'zod';
import { ErrorList, InputFiled } from '~/components/forms';
import { Button } from '~/components/ui';
import { login, sessionKey } from '~/utils/auth.server';

const LoginFormSchema = z.object({
	username: z.string().min(4),
	password: z.string(),
	redirectTo: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const agent = request.headers.get('User-Agent');
	const submission = await parseWithZod(formData, {
		schema: LoginFormSchema.transform(async (data, ctx) => {
			const session = await login({ ...data, agent });
			if (!session) {
				ctx.addIssue({
					code: 'custom',
					message: 'Invalid Credentials',
				});
				return z.NEVER;
			}
			return { ...data, session };
		}),
		async: true,
	});
	if (submission.status !== 'success') {
		return json({
			submission: submission.reply(),
			status: 'error',
		} as const);
	}

	const { session, redirectTo } = submission.value;

	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	cookieSession.set(sessionKey, session.id);

	return redirect(safeRedirect(redirectTo), {
		headers: {
			'set-cookie': await sessionStorage.commitSession(cookieSession, {
				expires: session.expiresAt,
			}),
		},
	});
};

const LoginPage = () => {
	const actionData = useActionData<typeof action>();
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		constraint: getZodConstraint(LoginFormSchema),
		lastResult: actionData?.submission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginFormSchema });
		},
	});

	return (
		<div className='flex min-h-full flex-col justify-center pb-32 pt-20'>
			<div className='mx-auto w-full max-w-md'>
				<div className='flex flex-col gap-3 text-center'>
					<h1 className='text-h1'>Welcome back!</h1>
					<p className='text-body-md text-muted-foreground'>
						Please enter your details.
					</p>
				</div>

				<div>
					<div className='mx-auto w-full max-w-md px-8'>
						<Form method='POST' {...getFormProps(form)}>
							<InputFiled
								labelProps={{ children: 'Username' }}
								inputProps={{
									...getInputProps(fields.username, {
										type: 'text',
									}),
									autoFocus: true,
									className: 'lowercase',
								}}
								errors={fields.username.errors}
							/>

							<InputFiled
								labelProps={{ children: 'Password' }}
								inputProps={{
									...getInputProps(fields.password, {
										type: 'password',
									}),
									autoComplete: 'current-password',
								}}
								errors={fields.password.errors}
							/>

							<div className='ml-auto'>
								<Link
									to='/forgot-password'
									className='text-body-xs font-semibold'>
									Forgot password?
								</Link>
							</div>

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
									disabled={false}>
									Log in
								</Button>
							</div>
						</Form>
						<div className='flex items-center justify-center gap-2 pt-6'>
							<span className='text-muted-foreground'>
								New here?
							</span>
							<Link to={'/signup'}>Create an account</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
