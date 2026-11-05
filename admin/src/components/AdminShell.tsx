import { AlertTriangle, CheckCircle2, ExternalLink, ListPlus, LogOut, Menu, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api, publicSiteUrl } from "../lib/api";
import { DEFAULT_SITE_NAME } from "../lib/constants";
import { ADMIN_TOAST_EVENT, type AdminToastPayload } from "../lib/toast";
import type { SiteSettings } from "../lib/types";
import { cn } from "../lib/utils";
import { SiteLogo } from "./SiteLogo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/blogs", label: "Blogs", exact: true },
  { href: "/blogs/new", label: "Create Blog", exact: true },
  { href: "/settings", label: "Settings", exact: false },
];

function pageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/blogs") return "Tour Blogs";
  if (pathname === "/blogs/new") return "Create Blog";
  if (/^\/blogs\/[^/]+\/edit$/.test(pathname)) return "Edit Blog";
  if (pathname === "/settings") return "Website Settings";
  return "Admin";
}

export function AdminShell() {
  const { user, logout } = useAuth();
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState({ websiteName: DEFAULT_SITE_NAME, logo: "" });
  const [toast, setToast] = useState<(AdminToastPayload & { id: number }) | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<AdminToastPayload>).detail;
      if (!detail?.message) return;
      setToast({ ...detail, id: Date.now() });
    }

    window.addEventListener(ADMIN_TOAST_EVENT, onToast);
    return () => window.removeEventListener(ADMIN_TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const data = await api<{ settings: SiteSettings }>("/settings", { auth: false });
        if (!cancelled) {
          setBrand({
            websiteName: data.settings.websiteName || DEFAULT_SITE_NAME,
            logo: data.settings.logo || "",
          });
        }
      } catch {
        if (!cancelled) setBrand({ websiteName: DEFAULT_SITE_NAME, logo: "" });
      }
    }

    void loadSettings();
    const onSettingsUpdated = () => {
      void loadSettings();
    };
    window.addEventListener("cd-admin:settings-updated", onSettingsUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("cd-admin:settings-updated", onSettingsUpdated);
    };
  }, []);

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  const mobileNav = (
    <div className="border-t border-white/10 bg-[#212121] px-5 pb-6 pt-4 lg:hidden">
      <nav className="flex flex-col" aria-label="Admin navigation">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "border-b border-white/[0.06] px-3 py-3 font-display text-xl uppercase tracking-wide",
                active ? "text-ember-300" : "text-white/80 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {user?.name || "Administrator"}
          </p>
          <p className="truncate text-[11px] text-white/45">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-white/60 transition hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
      <a
        href={publicSiteUrl("/")}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-ember-300"
      >
        <ExternalLink className="h-3.5 w-3.5" /> View website
      </a>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[4px] focus:bg-ember-500 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header className="relative z-50 bg-[#212121] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        <div className="container-page">
          <div className="flex h-[64px] items-center gap-4 md:h-[50px]">
            <div className="flex w-auto shrink-0 items-center md:w-[225px]">
              <SiteLogo
                name={brand.websiteName}
                src={brand.logo}
                className="[&_.font-display]:text-[20px] [&_div>span:last-child]:hidden [&_img]:max-h-9"
              />
            </div>

            <nav className="hidden flex-1 items-stretch self-stretch lg:flex" aria-label="Admin">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-5 font-display text-[20px] uppercase leading-none tracking-wide transition",
                      active
                        ? "bg-ember-500 text-white"
                        : "text-white/85 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto hidden items-center gap-2 lg:flex">
              <span className="h-5 w-px bg-white/15" />
              <span className="max-w-[160px] truncate px-2 text-[11px] text-white/55">
                {user?.name || "Administrator"}
              </span>
              <a
                href={publicSiteUrl("/")}
                target="_blank"
                rel="noreferrer"
                className="admin-header-icon"
                aria-label="View website"
                title="View website"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={signOut}
                className="admin-header-icon"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <a
                href={publicSiteUrl("/")}
                target="_blank"
                rel="noreferrer"
                className="admin-header-icon"
                aria-label="View website"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="admin-header-icon"
                aria-expanded={open}
                aria-controls="admin-mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="hidden h-[45px] items-center justify-between gap-6 border-t border-white/[0.06] lg:flex">
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-white/40">
              Admin workspace · Manage tours, schedules and site settings
            </p>
            <div className="flex items-center gap-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-white/45">
                Admin / {pageTitle(pathname)}
              </p>
              <Link to="/blogs/new" className="btn-primary btn-sm">
                <Plus className="h-3.5 w-3.5" /> New blog
              </Link>
            </div>
          </div>
        </div>

        {open ? <div id="admin-mobile-nav">{mobileNav}</div> : null}
      </header>

      <main id="admin-main" className="flex-1">
        <div className="mx-auto w-full max-w-[1250px] px-5 py-7 lg:py-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-[#222222] text-white">
        <div className="container-page flex flex-col gap-2 py-5 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.websiteName}. Admin workspace.
          </p>
          <p className="flex items-center gap-2">
            <ListPlus className="h-3.5 w-3.5 text-ember-300" />
            Manage tour announcements, schedules and site settings.
          </p>
        </div>
      </footer>

      {toast ? (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-5 right-5 z-[80] flex w-[calc(100vw-2.5rem)] max-w-sm items-start gap-3 border border-[#e5e5e5] border-l-4 bg-white px-4 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] animate-fade-up",
            toast.tone === "error" ? "border-l-red-500" : "border-l-emerald-500"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              toast.tone === "error"
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            )}
          >
            {toast.tone === "error" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold text-[#333333]">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded-[4px] p-1 text-[#999999] transition hover:bg-black/5 hover:text-[#333333]"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
