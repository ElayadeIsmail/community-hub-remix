import { getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json } from '@remix-run/node';
import { Form, Link, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { InputFiled } from '~/components/form';
import { Button } from '~/components/ui';

const LoginSchema = z.object({
	username: z.string().min(4),
	password: z.string(),
	redirectTo: z.string().optional(),
	remember: z.boolean().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema: LoginSchema });
	// Send the submission back to the client if the status is not successful
	if (submission.status !== 'success') {
		return json({
			submission: submission.reply(),
			status: 'error',
		} as const);
	}

	// DO LOGIN
	return json({
		submission: submission.reply(),
		status: 'success',
	} as const);
};

const LoginPage = () => {
	const actionData = useActionData<typeof action>();
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		lastResult: actionData?.submission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginSchema });
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
						<Form
							method='POST'
							id={form.id}
							onSubmit={form.onSubmit}>
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

							<div className='flex justify-between'>
								{/* <CheckboxField
									labelProps={{
										htmlFor: fields.remember.id,
										children: 'Remember me',
									}}
									buttonProps={conform.input(
										fields.remember,
										{
											type: 'checkbox',
										}
									)}
									errors={fields.remember.errors}
								/> */}
								<div>
									<Link
										to='/forgot-password'
										className='text-body-xs font-semibold'>
										Forgot password?
									</Link>
								</div>
							</div>

							{/* <input
								{...conform.input(fields.redirectTo, {
									type: 'hidden',
								})}
							/> */}
							{/* <ErrorList errors={form.errors} id={form.errorId} /> */}

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
