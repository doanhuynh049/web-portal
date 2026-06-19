/**
 * /login — Sign in with email + password (NextAuth credentials).
 *
 * Layout: split-screen (left branding panel + right form panel).
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
  const features = [
    { icon: LayoutGrid, title: "Smart Link Organization", desc: "Categorize and pin your most-used links" },
    { icon: FolderOpen, title: "Project Grouping", desc: "Bundle local, staging, and production URLs together" },
    { icon: Search, title: "Instant Search", desc: "Find any link by title, tag, or purpose in milliseconds" },
    { icon: Zap, title: "Powered by Neon + Vercel", desc: "Serverless Postgres with global edge deployment" },
  ];

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #07070e 0%, #0c1220 55%, #0a1628 100%)",
        minWidth: 0,
        flex: "0 0 52%",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Grid pattern */}
      <svg
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#7ba3ff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Glow orbs */}
      <div aria-hidden style={{ position: "absolute", top: "15%", right: "-8%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,131,245,0.16) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", bottom: "8%", left: "-8%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,93,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", top: "50%", left: "40%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #4f83f5 0%, #7c5df7 100%)",
            boxShadow: "0 2px 12px rgba(79,131,245,0.4)",
          }}
        >
          <Globe size={18} color="#fff" />
        </div>
        <span className="text-base font-bold" style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}>
          Web Portal
        </span>
      </div>

      {/* Hero */}
      <div className="relative z-10">
        <h1
          className="text-4xl font-bold leading-tight mb-4"
          style={{ color: "#f0f0f5", letterSpacing: "-0.04em" }}
        >
          Your Personal
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #4f83f5 0%, #7c5df7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Command Center
          </span>
        </h1>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: "#7070a0", maxWidth: 360 }}>
          Organize all your projects, links, and tools in one beautiful, searchable portal.
        </p>

        <div className="flex flex-col gap-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 rounded-lg flex items-center justify-center mt-0.5"
                style={{
                  width: 28, height: 28,
                  background: "rgba(79,131,245,0.12)",
                  border: "1px solid rgba(79,131,245,0.20)",
                }}
              >
                <Icon size={13} color="#4f83f5" />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#b0b0cc" }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#5a5a7a" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <p className="text-xs" style={{ color: "#36364a" }}>
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
      style={{
        flex: 1,
        minHeight: "100dvh",
        background: "var(--bg)",
      }}
    >
      <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4f83f5 0%, #7c5df7 100%)",
              boxShadow: "0 2px 10px rgba(79,131,245,0.35)",
            }}
          >
            <Globe size={16} color="#fff" />
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--fg)", letterSpacing: "-0.01em" }}>
            Web Portal
          </span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}
          >
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
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--fg-subtle)" }}
              />
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--fg-subtle)" }}
              />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-subtle)", padding: 0, lineHeight: 1 }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.18)",
                color: "#fca5a5",
                animation: "fadeIn 150ms ease",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "10px 16px",
              fontSize: "14px",
              borderRadius: "8px",
              marginTop: 2,
            }}
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
        <p className="text-center text-xs" style={{ color: "var(--fg-subtle)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Create account
          </Link>
        </p>

        {/* Footer */}
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
    <div className="min-h-dvh flex" style={{ background: "var(--bg)" }}>
      <BrandingPanel />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
