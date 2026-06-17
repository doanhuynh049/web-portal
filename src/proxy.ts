/**
 * Next.js Proxy (Middleware) — authentication guard.
 *
 * Uses NextAuth v5 JWT sessions. Public paths (/login, /register,
 * /api/auth, /api/register, /api/setup) are always accessible.
 * All other routes require a valid session.
 */
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
