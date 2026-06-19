/**
 * /login — Sign in with email + password (NextAuth credentials).
 *
 * Layout: split-screen (left branding panel + right form panel).
 * Inspired by modern financial / SaaS dashboard login pages.
 */
"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe, Mail, Lock, Eye, EyeOff,
  LayoutGrid, FolderOpen, Search, Zap,
} from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";

// ── Left branding panel ───────────────────────────────────────────────────────

function BrandingPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0c0c10 0%, #0f172a 50%, #0c1a2e 100%)",
        minWidth: 0,
        flex: "0 0 52%",
      }}
    >
      {/* Decorative grid */}
      <svg
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Glowing orb */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "20%",
          right: "-10%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-5%",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#3b82f6" }}
        >
          <Globe size={22} color="#fff" />
        </div>
        <span className="text-lg font-bold" style={{ color: "#f4f4f5" }}>
          Web Portal
        </span>
      </div>

      {/* Hero text */}
      <div className="relative z-10">
        <h1
          className="text-4xl font-bold leading-tight mb-4"
          style={{ color: "#f4f4f5" }}
        >
          Your Personal
          <br />
          <span style={{ color: "#60a5fa" }}>Command Center</span>
        </h1>
        <p className="text-base mb-10" style={{ color: "#94a3b8", maxWidth: 380 }}>
          Organize all your projects, links, and tools in one beautiful, searchable portal.
        </p>

        {/* Feature list */}
        <div className="flex flex-col gap-4">
          {[
            {
              icon: <LayoutGrid size={16} />,
              title: "Smart Link Organization",
              desc: "Categorize and pin your most-used links",
            },
            {
              icon: <FolderOpen size={16} />,
              title: "Project Grouping",
              desc: "Bundle local, staging, and production URLs together",
            },
            {
              icon: <Search size={16} />,
              title: "Instant Search",
              desc: "Find any link by title, tag, or purpose in milliseconds",
            },
            {
              icon: <Zap size={16} />,
              title: "Powered by Neon + Vercel",
              desc: "Serverless Postgres with global edge deployment",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}
              >
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{f.title}</p>
                <p className="text-xs" style={{ color: "#64748b" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom quote */}
      <div className="relative z-10">
        <p className="text-xs" style={{ color: "#475569" }}>
          Built for developers who value speed and clarity.
        </p>
      </div>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        emailRef.current?.select();
      } else {
        const from = params.get("from") ?? "/";
        router.push(from);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col justify-center px-8 py-12 sm:px-12"
      style={{ flex: "1 1 0", minWidth: 0, background: "var(--bg)" }}
    >
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
        {/* Mobile logo (hidden on lg) */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#3b82f6" }}
          >
            <Globe size={20} color="#fff" />
          </div>
          <span className="text-base font-bold" style={{ color: "var(--fg)" }}>Web Portal</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1.5" style={{ color: "var(--fg)" }}>
            Welcome back
          </h2>
          <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
              Email address
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)" }}
              />
              <input
                ref={emailRef}
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                autoComplete="email"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
              Password
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)" }}
              />
              <input
                className="input"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)", background: "none", border: "none", cursor: "pointer" }}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
              style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn btn-primary"
            style={{ justifyContent: "center", marginTop: 2, padding: "10px 16px" }}
          >
            {loading ? (
              <span style={{ opacity: 0.8 }}>Signing in…</span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--fg-faint)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Register */}
        <p className="text-center text-sm" style={{ color: "var(--fg-subtle)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Create account
          </Link>
        </p>

        {/* Footer hint */}
        <p className="text-center text-xs mt-8" style={{ color: "var(--fg-faint)" }}>
          Personal portal · Private access only
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div
      className="min-h-dvh flex"
      style={{ background: "var(--bg)" }}
    >
      <BrandingPanel />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
