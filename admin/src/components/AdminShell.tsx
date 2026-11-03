import {
  ExternalLink,
  LayoutDashboard,
  ListPlus,
  LogOut,
  Menu,
  Music,
  Newspaper,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api, publicSiteUrl } from "../lib/api";
import { DEFAULT_SITE_NAME } from "../lib/constants";
import type { SiteSettings } from "../lib/types";
import { cn } from "../lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/blogs", label: "Blogs", icon: Newspaper, exact: true },
  { href: "/blogs/new", label: "Create Blog", icon: Plus, exact: true },
  { href: "/settings", label: "Settings", icon: Settings, exact: false },
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
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const data = await api<{ settings: SiteSettings }>("/settings", { auth: false });
        if (!cancelled) setSiteName(data.settings.websiteName || DEFAULT_SITE_NAME);
      } catch {
        if (!cancelled) setSiteName(DEFAULT_SITE_NAME);
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

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center justify-between px-5">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-500">
            <Music className="h-4 w-4 text-white" />
          </span>
          <span className="flex flex-col">
            <span className="max-w-[150px] truncate font-display text-base font-bold uppercase leading-none tracking-tight text-white">
              {siteName}
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/35">
              Admin Suite
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin navigation">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
          Manage
        </p>
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn("admin-nav-link", active && "admin-nav-link-active")}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
            Site
          </p>
          <a
            href={publicSiteUrl("/tours")}
            target="_blank"
            rel="noreferrer"
            className="admin-nav-link"
          >
            <ExternalLink className="h-4 w-4" /> View website
          </a>
          <Link to="/blogs/new" className="admin-nav-link lg:hidden">
            <ListPlus className="h-4 w-4" /> Quick create
          </Link>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-bold text-white">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name || "Administrator"}</p>
            <p className="truncate text-[11px] text-white/40">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/50 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink-950 lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-ink-950 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-ink-950/[0.07] bg-[#f6f5f2]/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="btn-icon lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-600">
                  Admin / {pageTitle(pathname)}
                </p>
                <h1 className="font-display text-xl font-bold uppercase leading-none tracking-tight text-ink-950">
                  {pageTitle(pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/blogs/new" className="btn-primary btn-sm hidden sm:inline-flex">
                <Plus className="h-4 w-4" /> New blog
              </Link>
              <a
                href={publicSiteUrl("/")}
                target="_blank"
                rel="noreferrer"
                className="btn-icon hidden sm:inline-flex"
                aria-label="View website"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
