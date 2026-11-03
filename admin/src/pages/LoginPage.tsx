import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, Music, ShieldCheck, Ticket } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { errorMessage, publicSiteUrl } from "../lib/api";
import { DEFAULT_SITE_NAME } from "../lib/constants";
import { Spinner } from "../components/Spinner";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: "Email is required." });
      return;
    }
    if (!password) {
      setFieldErrors({ password: "Password is required." });
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      const destination = from && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(errorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-sand-50 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url('/images/hero-concert.svg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950/80 to-ember-900/40" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ember-500">
            <Music className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold uppercase leading-none tracking-tight">
              {DEFAULT_SITE_NAME}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
              Admin Suite
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-ember-400">
            Backstage access
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.94] tracking-tight xl:text-6xl">
            Publish the next big tour.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Manage announcements, schedule widgets and everything your audience sees
            on Concert Discovery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Protected admin area
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white/60">
              <Ticket className="h-4 w-4 text-ember-400" /> TicketNetwork ready
            </span>
          </div>
        </div>

        <p className="relative text-[11px] text-white/30">
          © {new Date().getFullYear()} {DEFAULT_SITE_NAME}. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <a
            href={publicSiteUrl("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ink-600 transition hover:text-ink-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </a>

          <div className="mt-8 lg:hidden">
            <div className="flex items-center gap-2.5 text-ink-950">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember-500 text-white">
                <Music className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl font-bold uppercase leading-none">
                {DEFAULT_SITE_NAME}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-ink-950/[0.07] bg-white p-7 shadow-card sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember-50 text-ember-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold uppercase leading-none text-ink-950">
              Admin sign in
            </h2>
            <p className="mt-2 text-sm text-ink-600">
              Enter your administrator credentials to continue.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
              {error ? (
                <div
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="field-label">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input h-12 pl-11"
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                </div>
                {fieldErrors.email ? <p className="field-error">{fieldErrors.email}</p> : null}
              </div>

              <div>
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input h-12 pl-11 pr-12"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(fieldErrors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-600 transition hover:bg-ink-950/5 hover:text-ink-950"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
              </div>

              <button type="submit" disabled={submitting} className="btn-primary h-12 w-full">
                {submitting ? (
                  <>
                    <Spinner className="h-4 w-4" /> Signing in…
                  </>
                ) : (
                  "Sign in to dashboard"
                )}
              </button>

              <p className="text-center text-xs text-ink-600">
                Administrator access only. Public registration is disabled.
              </p>
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-ink-600/70">
            {DEFAULT_SITE_NAME} admin · Secure session
          </p>
        </div>
      </div>
    </div>
  );
}
