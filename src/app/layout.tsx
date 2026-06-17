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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
