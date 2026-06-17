/**
 * /register — Create a new portal account.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        router.push("/login?registered=1");
      } else {
        setError(data.error ?? "Registration failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--accent)" }}
          >
            <Globe size={28} color="#fff" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--fg)" }}>
            Create Account
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--fg-subtle)" }}>
            Join My Web Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
              Display Name
            </span>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)" }}
              />
              <input
                className="input pl-9"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                autoComplete="name"
              />
            </div>
          </label>

          {/* Email */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
              Email
            </span>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)" }}
              />
              <input
                className="input pl-9"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </label>

          {/* Password */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
              Password
              <span style={{ color: "var(--fg-faint)", fontWeight: 400, marginLeft: 4 }}>
                (min. 6 characters)
              </span>
            </span>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)" }}
              />
              <input
                className="input pl-9 pr-10"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--fg-subtle)", background: "none", border: "none", cursor: "pointer" }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-md"
              style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn btn-primary"
            style={{ justifyContent: "center", marginTop: 4 }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--fg-subtle)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
