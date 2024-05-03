import type { LinksFunction } from "@remix-run/node";
import { cssBundleHref } from "@remix-run/css-bundle";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import tailwindStylesheet from "~/styles/tailwind.css?url";
import fontStylesheet from "~/styles/font.css?url";


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheet },
  { rel: "stylesheet", href: fontStylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
