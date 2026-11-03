import {
  CalendarDays,
  FileText,
  ImageIcon,
  Plus,
  SearchX,
  Star,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { BlogFilters } from "../components/admin/BlogFilters";
import { BlogRowActions } from "../components/admin/BlogRowActions";
import { Pagination } from "../components/Pagination";
import { SpinnerBlock } from "../components/Spinner";
import { api, assetUrl, errorMessage } from "../lib/api";
import { GENRES } from "../lib/constants";
import type { BlogListResult } from "../lib/types";
import { formatDateRange, formatDateShort } from "../lib/utils";

function parseFilters(params: URLSearchParams) {
  const q = (params.get("q") || "").slice(0, 120);
  const statusRaw = params.get("status") || "";
  const status = statusRaw === "PUBLISHED" || statusRaw === "DRAFT" ? statusRaw : "";
  const genreRaw = params.get("genre") || "";
  const genre = (GENRES as readonly string[]).includes(genreRaw) ? genreRaw : "";
  const pageRaw = Number(params.get("page") || 1);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  return { q, status, genre, page };
}

export function BlogsPage() {
  const [searchParams] = useSearchParams();
  const filterKey = searchParams.toString();
  const { q, status, genre, page } = parseFilters(new URLSearchParams(filterKey));
  const [data, setData] = useState<BlogListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (genre) params.set("genre", genre);
      if (page > 1) params.set("page", String(page));

      try {
        const result = await api<BlogListResult>(
          `/admin/blogs${params.toString() ? `?${params.toString()}` : ""}`
        );
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
  }, [q, status, genre, page, reloadKey]);

  const hasFilters = Boolean(q || status || genre);
  const total = data?.total || 0;
  const start = total === 0 ? 0 : (page - 1) * (data?.pageSize || 12) + 1;
  const end = Math.min(page * (data?.pageSize || 12), total);
  const counts = data?.counts || { draft: 0, published: 0, featured: 0, all: 0 };

  const stats = [
    {
      label: "Published",
      value: counts.published,
      href: "/blogs?status=PUBLISHED",
      icon: FileText,
    },
    { label: "Drafts", value: counts.draft, href: "/blogs?status=DRAFT", icon: Ticket },
    { label: "Featured", value: counts.featured, href: "/blogs", icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember-600">
            Content library
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none tracking-tight text-ink-950">
            All blogs
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Create, edit, publish and feature every tour announcement.
          </p>
        </div>
        <Link to="/blogs/new" className="btn-primary btn-sm">
          <Plus className="h-4 w-4" /> New blog
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="flex items-center gap-3 rounded-2xl border border-ink-950/[0.07] bg-white px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-ember-500/30 hover:shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-50 text-ember-600">
              <stat.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-display text-xl font-bold leading-none text-ink-950">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">
                {stat.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <BlogFilters initialQuery={q} initialStatus={status} initialGenre={genre} />

      <section className="admin-card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-950/[0.06] px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-bold uppercase text-ink-950">
              {hasFilters ? "Filtered results" : "Tour announcements"}
            </h3>
            <p className="text-[11px] text-ink-600">
              {total > 0 ? (
                <>
                  Showing <span className="font-semibold text-ink-900">{start}–{end}</span> of{" "}
                  <span className="font-semibold text-ink-900">{total}</span>
                </>
              ) : (
                "No matching announcements"
              )}
            </p>
          </div>
          {hasFilters ? (
            <Link
              to="/blogs"
              className="text-[11px] font-bold uppercase tracking-[0.1em] text-ember-600 hover:text-ember-700"
            >
              Clear filters
            </Link>
          ) : null}
        </div>

        {loading ? (
          <SpinnerBlock label="Loading blogs..." />
        ) : error ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="btn-outline btn-sm mt-4"
            >
              Try again
            </button>
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-950/[0.06] bg-sand-50/60 text-[10px] uppercase tracking-[0.12em] text-ink-600">
                    <th className="px-5 py-3 font-semibold">Announcement</th>
                    <th className="px-4 py-3 font-semibold">Genre</th>
                    <th className="px-4 py-3 font-semibold">Tour dates</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Published</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/[0.05]">
                  {data.items.map((blog) => (
                    <tr key={blog.id} className="transition hover:bg-sand-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                            {blog.featuredImage ? (
                              <img
                                src={assetUrl(blog.featuredImage)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-white/40">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/blogs/${blog.id}/edit`}
                              className="flex items-center gap-1.5 font-semibold text-ink-950 hover:text-ember-600"
                            >
                              <span className="line-clamp-1">{blog.title}</span>
                              {blog.featured ? (
                                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                              ) : null}
                            </Link>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-600">
                              {blog.artistName}
                              {blog.tourName ? ` · ${blog.tourName}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-ink-950/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-700">
                          {blog.genre}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-ink-600">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-ink-600/60" />
                          {formatDateRange(blog.tourStartDate, blog.tourEndDate) || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={
                            blog.status === "PUBLISHED"
                              ? "badge-status-published"
                              : "badge-status-draft"
                          }
                        >
                          {blog.status === "PUBLISHED" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-ink-600">
                        {formatDateShort(blog.publishedAt) || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <BlogRowActions
                          id={blog.id}
                          title={blog.title}
                          status={blog.status}
                          featured={blog.featured}
                          onChanged={() => setReloadKey((value) => value + 1)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 pb-5">
              <Pagination
                basePath="/blogs"
                currentPage={page}
                totalPages={data.totalPages}
                params={{ q, status, genre }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ember-50 text-ember-600">
              {hasFilters ? <SearchX className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
            </span>
            <h3 className="mt-4 font-display text-2xl font-bold uppercase text-ink-950">
              {hasFilters ? "No matching blogs" : "No blogs yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-ink-600">
              {hasFilters
                ? "Try a different search term, status or genre, or clear the filters."
                : "Create your first tour announcement to start filling the public site."}
            </p>
            <Link
              to={hasFilters ? "/blogs" : "/blogs/new"}
              className="btn-primary btn-sm mt-5"
            >
              {hasFilters ? "Clear filters" : "Create blog"}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
