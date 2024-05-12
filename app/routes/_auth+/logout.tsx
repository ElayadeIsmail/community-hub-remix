import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { logout, requireUser } from '~/utils/auth.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request);
	return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
	throw await logout({ request });
};
