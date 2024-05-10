import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction } from '@remix-run/node';

import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import fontStylesheet from '~/styles/font.css?url';
import tailwindStylesheet from '~/styles/tailwind.css?url';
import { Button } from './components/ui';

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: tailwindStylesheet },
	{ rel: 'stylesheet', href: fontStylesheet },
	...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en' className='dark'>
			<head>
				<meta charSet='utf-8' />
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				/>
				<Meta />
				<Links />
			</head>
			<body>
				<header className='h-12 flex items-center justify-between container'>
					<Link to={'/'} className='text-primary italic font-bold'>
						Community Hub
					</Link>
					<div className='flex space-x-4'>
						<Button asChild>
							<Link to='/signup'>Register</Link>
						</Button>
						<Button variant='secondary' asChild>
							<Link to='/login'>Login</Link>
						</Button>
					</div>
				</header>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
