import type { MetaFunction } from '@remix-run/node';
import { useMatches } from '@remix-run/react';

export const meta: MetaFunction = () => {
	return [
		{ title: 'Community Hub' },
		{ name: 'description', content: 'Welcome to Remix!' },
	];
};

export default function Index() {
	const matchers = useMatches();
	const rootData = matchers.find((_m) => _m.id === 'root')?.data as {
		user?: { id: string; username: string; name: string };
	};
	console.log('user', rootData.user);
	return (
		<div>
			<h1>HELLO FRIEND</h1>
		</div>
	);
}
