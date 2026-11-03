import { Mail, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import type { SiteSettings } from "../lib/types";
import { cn } from "../lib/utils";
import { LogoLight } from "./Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/tours", label: "All Tours" },
  { href: "/tours#genres", label: "Genres", hidden: true },
  { href: "/contact", label: "Contact" },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/tours#genres") return false;
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/tours" && pathname.startsWith("/tours/"));
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setOpen(false);
    setQuery(new URLSearchParams(location.search).get("q") || "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function search(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/tours?q=${encodeURIComponent(value)}` : "/tours");
    setOpen(false);
  }

  return (
    <header className="relative z-50 bg-[#212121] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
      <div className="container-page">
        <div className="flex h-[64px] items-center gap-4 md:h-[50px]">
          <div className="flex w-auto shrink-0 items-center md:w-[225px]">
            <LogoLight
              name={settings.websiteName}
              src={settings.logo}
              className="[&_.font-display]:text-[20px] [&_div>span:last-child]:hidden [&_img]:max-h-9"
            />
          </div>

          <nav className="hidden flex-1 items-stretch self-stretch lg:flex" aria-label="Primary">
            {NAV.filter((item) => !item.hidden).map((item) => {
              const active = isActive(item.href, location.pathname);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-5 font-display text-[20px] uppercase leading-none tracking-wide transition",
                    active ? "bg-ember-500 text-white" : "text-white/85 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="h-5 w-px bg-white/15" />
            <Link
              to="/contact"
              className="px-2 text-xs font-bold uppercase tracking-[0.12em] text-white/70 transition hover:text-white"
            >
              Get tour alerts
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <Link to="/tours" aria-label="Search tours" className="btn-icon">
              <Search className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="btn-icon"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="hidden h-[45px] items-center justify-between gap-6 border-t border-white/[0.06] lg:flex">
          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-white/40">
            {settings.tagline}
          </p>
          <div className="flex items-center gap-4">
            {settings.contactEmail ? (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/60 transition hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 text-ember-300" />
                {settings.contactEmail}
              </a>
            ) : null}
            <form onSubmit={search} className="relative w-[284px]" role="search">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search artists, venues, cities..."
                aria-label="Search artists, venues, cities"
                className="h-[34px] w-full rounded-[5px] border border-white/20 bg-[#1a1a1a] pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-ember-400 focus:shadow-[0_0_6px_rgba(23,145,199,0.5)]"
              />
            </form>
          </div>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-[#212121] px-5 pb-6 pt-4 lg:hidden"
        >
          <form onSubmit={search} className="relative mb-4" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search artists, venues, cities..."
              aria-label="Search artists, venues, cities"
              className="h-11 w-full rounded-[5px] border border-white/20 bg-[#1a1a1a] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-ember-400"
            />
          </form>
          <nav className="flex flex-col" aria-label="Mobile">
            {NAV.filter((item) => !item.hidden).map((item) => {
              const active = isActive(item.href, location.pathname);
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
          {settings.contactEmail ? (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="mt-4 inline-flex items-center gap-2 px-3 text-xs text-white/55"
            >
              <Mail className="h-4 w-4 text-ember-300" />
              {settings.contactEmail}
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
