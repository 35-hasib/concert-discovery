import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Spinner } from "../components/Spinner";
import { SiteLogo } from "../components/SiteLogo";
import { useAuth } from "../context/AuthContext";
import { errorMessage, publicSiteUrl } from "../lib/api";
import { DEFAULT_SITE_NAME } from "../lib/constants";

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
    <div className="flex min-h-screen flex-col">
      <header className="relative z-50 bg-[#212121] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        <div className="container-page">
          <div className="flex h-[64px] items-center justify-between gap-4 md:h-[50px]">
            <SiteLogo
              name={DEFAULT_SITE_NAME}
              href="/login"
              className="[&_.font-display]:text-[20px] [&_div>span:last-child]:hidden [&_img]:max-h-9"
            />
            <a
              href={publicSiteUrl("/")}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/65 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to website
            </a>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <div className="border border-[#e5e5e5] bg-white p-7 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center border border-ember-500/20 bg-ember-50 text-ember-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-ember-600">
              Admin access
            </p>
            <h1 className="mt-1 font-display text-[36px] uppercase leading-none text-[#535353]">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-[#777777]">
              Enter your administrator credentials to manage the site.
            </p>
            <div className="rule-accent mt-5" />

            <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
              {error ? (
                <div
                  className="flex items-start gap-2.5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
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
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[4px] p-1.5 text-[#777777] transition hover:bg-black/5 hover:text-[#333333]"
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

              <p className="text-center text-xs text-[#888888]">
                Administrator access only. Public registration is disabled.
              </p>
            </form>
          </div>

          <p className="mt-5 text-center text-[11px] text-[#777777]">
            {DEFAULT_SITE_NAME} admin · Secure session
          </p>
        </div>
      </main>

      <footer className="bg-[#222222] text-white">
        <div className="container-page flex flex-col gap-2 py-5 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {DEFAULT_SITE_NAME}. Admin workspace.
          </p>
          <p>Protected administrator area.</p>
        </div>
      </footer>
    </div>
  );
}
