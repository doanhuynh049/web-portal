/**
 * Root layout.
 *
 * Theme is controlled purely client-side via localStorage + CSS class.
 * SessionProvider wraps the app to enable next-auth/react client hooks.
 */
import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "My Web Portal",
  description: "Personal link manager — all your projects and resources in one place",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:7854"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
