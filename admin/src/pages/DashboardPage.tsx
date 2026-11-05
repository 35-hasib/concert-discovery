import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SpinnerBlock } from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { api, assetUrl, errorMessage } from "../lib/api";
import type { DashboardResult } from "../lib/types";
import { formatDateShort, timeAgo } from "../lib/utils";

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await api<DashboardResult>("/admin/dashboard");
        if (!cancelled) setData(result);
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.stats;
  const firstName = (user?.name || "Administrator").split(" ")[0];

  const cards = [
    {
      label: "Total blogs",
      value: stats?.total || 0,
      icon: FileText,
      href: "/blogs",
      dark: true,
    },
    {
      label: "Published",
      value: stats?.published || 0,
      icon: CheckCircle2,
      href: "/blogs?status=PUBLISHED",
      dark: false,
    },
    {
      label: "Drafts",
      value: stats?.drafts || 0,
      icon: Clock,
      href: "/blogs?status=DRAFT",
      dark: false,
    },
    {
      label: "Featured",
      value: stats?.featured || 0,
      icon: Star,
      href: "/blogs",
      dark: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember-600">
            Overview
          </p>
          <h2 className="mt-1 font-display text-[32px] font-normal uppercase leading-none text-[#535353]">
            Welcome back, {firstName}
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Here is what is happening across your tour announcements.
          </p>
        </div>
        <Link to="/blogs/new" className="btn-primary btn-sm">
          <Plus className="h-4 w-4" /> Quick create blog
        </Link>
      </div>

      {loading ? (
        <div className="admin-card">
          <SpinnerBlock label="Loading dashboard..." />
        </div>
      ) : error ? (
        <div className="admin-card text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-outline btn-sm mt-4"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((stat) => (
              <Link
                key={stat.label}
                to={stat.href}
                className={`group relative overflow-hidden rounded-[3px] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)] ${
                  stat.dark
                    ? "border-[#333333] bg-[#222222] text-white"
                    : "border-[#e5e5e5] bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      stat.dark ? "bg-white/10 text-ember-300" : "bg-ember-50 text-ember-600"
                    }`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 transition group-hover:translate-x-0.5 ${
                      stat.dark ? "text-white/30" : "text-ink-600/40"
                    }`}
                  />
                </div>
                <p className="mt-5 font-display text-4xl font-bold leading-none tracking-tight">
                  {stat.value}
                </p>
                <p
                  className={`mt-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                    stat.dark ? "text-white/50" : "text-ink-600"
                  }`}
                >
                  {stat.label}
                </p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="admin-card p-0">
              <div className="flex items-center justify-between gap-3 border-b border-ink-950/[0.06] px-5 py-4">
                <div>
                  <h3 className="font-display text-[22px] font-normal uppercase text-[#535353]">
                    Recently updated
                  </h3>
                  <p className="text-[11px] text-ink-600">The latest edits across your library</p>
                </div>
                <Link
                  to="/blogs"
                  className="text-[11px] font-bold uppercase tracking-[0.1em] text-ember-600 hover:text-ember-700"
                >
                  View all
                </Link>
              </div>

              {data?.recent.length ? (
                <div className="divide-y divide-ink-950/[0.05]">
                  {data.recent.map((blog) => (
                    <Link
                      key={blog.id}
                      to={`/blogs/${blog.id}/edit`}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-sand-50/70"
                    >
                      <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                        {blog.featuredImage ? (
                          <img
                            src={assetUrl(blog.featuredImage)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ember-600 to-ink-900 font-display text-[10px] font-bold text-white">
                            {blog.genre.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-950">{blog.title}</p>
                        <p className="truncate text-[11px] text-ink-600">
                          {blog.artistName} · {blog.genre}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <span
                          className={
                            blog.status === "PUBLISHED"
                              ? "badge-status-published"
                              : "badge-status-draft"
                          }
                        >
                          {blog.status === "PUBLISHED" ? "Published" : "Draft"}
                        </span>
                        <p className="mt-1 text-[10px] text-ink-600">
                          {timeAgo(blog.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-ink-600">
                    No blogs yet. Create your first announcement.
                  </p>
                  <Link to="/blogs/new" className="btn-primary btn-sm mt-4">
                    <Plus className="h-4 w-4" /> Create blog
                  </Link>
                </div>
              )}
            </section>

            <div className="space-y-6">
              <section className="admin-card">
                <h3 className="flex items-center gap-2 font-display text-[22px] font-normal uppercase text-[#535353]">
                  <Sparkles className="h-4 w-4 text-ember-600" /> Quick actions
                </h3>
                <div className="mt-4 space-y-2">
                  <Link to="/blogs/new" className="admin-quick-action">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-50 text-ember-600">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">
                        Create an announcement
                      </span>
                      <span className="block text-[11px] text-ink-600">
                        Publish a new tour blog
                      </span>
                    </span>
                  </Link>
                  <Link to="/blogs?status=DRAFT" className="admin-quick-action">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-ink-700">
                      <Clock className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">
                        Review drafts
                      </span>
                      <span className="block text-[11px] text-ink-600">
                        Finish unpublished posts
                      </span>
                    </span>
                  </Link>
                  <Link to="/settings" className="admin-quick-action">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-ink-700">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">
                        Update site settings
                      </span>
                      <span className="block text-[11px] text-ink-600">
                        Brand, social links and SEO
                      </span>
                    </span>
                  </Link>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-[3px] bg-[#222222] p-6 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-ember-500/25 blur-2xl" />
                <TrendingUp className="h-6 w-6 text-ember-400" />
                <h3 className="mt-4 font-display text-2xl font-normal uppercase leading-none">
                  Keep the lineup fresh
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-white/55">
                  Featured posts appear in the homepage spotlight. Use the star action in the
                  blog table to update them instantly.
                </p>
                <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ember-300">
                  <Star className="h-3.5 w-3.5" /> {stats?.featured || 0} featured right now
                </div>
                <Link
                  to="/blogs"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:text-ember-300"
                >
                  Manage posts <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>

              <section className="admin-card">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-600">
                  Last site activity
                </p>
                <p className="mt-2 text-sm text-ink-700">
                  {data?.recent[0]
                    ? `${data.recent[0].title} was updated ${timeAgo(data.recent[0].updatedAt)}.`
                    : "No activity recorded yet."}
                </p>
                {data?.recent[0] ? (
                  <p className="mt-1 text-[11px] text-ink-600">
                    Added {formatDateShort(data.recent[0].createdAt)}
                  </p>
                ) : null}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
