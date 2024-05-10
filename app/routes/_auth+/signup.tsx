import { getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { z } from 'zod';
import { ErrorList, InputFiled } from '~/components/form';
import { Button } from '~/components/ui';

const SignUpSchema = z.object({
	email: z.string().email(),
	redirectTo: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema: SignUpSchema });
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

const SignUpPage = () => {
	const actionData = useActionData<typeof action>();

	const [searchParams] = useSearchParams();
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
									}),
									autoFocus: true,
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
									disabled={false}>
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
