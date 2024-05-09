import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction } from '@remix-run/node';

import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import fontStylesheet from '~/styles/font.css?url';
import tailwindStylesheet from '~/styles/tailwind.css?url';

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
