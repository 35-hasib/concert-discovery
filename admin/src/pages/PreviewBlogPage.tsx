import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Eye,
  Pencil,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Spinner, SpinnerBlock } from "../components/Spinner";
import { TableOfContents } from "../components/TableOfContents";
import { WidgetFrame } from "../components/WidgetFrame";
import { api, assetUrl, errorMessage, publicSiteUrl } from "../lib/api";
import { prepareArticle } from "../lib/sanitize";
import type { Blog } from "../lib/types";
import { formatDate, formatDateRange, readingTime } from "../lib/utils";

export function PreviewBlogPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [widgetHtml, setWidgetHtml] = useState("");
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [widgetError, setWidgetError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api<{ blog: Blog }>(`/admin/blogs/${id}`);
        if (!cancelled) setBlog(data.blog);
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
  }, [id]);

  const hasWidget = Boolean(blog?.widgetEnabled && blog.widgetCode.trim());

  useEffect(() => {
    if (!blog || !hasWidget) {
      setWidgetHtml("");
      setWidgetError("");
      return;
    }

    let cancelled = false;
    setWidgetLoading(true);
    setWidgetError("");
    const widgetCode = blog.widgetCode;
    const blogTitle = blog.title;

    async function loadWidget() {
      try {
        const data = await api<{ html: string }>("/admin/widget-preview", {
          method: "POST",
          body: { code: widgetCode, title: blogTitle },
        });
        if (!cancelled) setWidgetHtml(data.html);
      } catch (previewError) {
        if (!cancelled) setWidgetError(errorMessage(previewError));
      } finally {
        if (!cancelled) setWidgetLoading(false);
      }
    }

    void loadWidget();
    return () => {
      cancelled = true;
    };
  }, [blog, hasWidget]);

  const article = useMemo(
    () => prepareArticle(blog?.content || ""),
    [blog?.content]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <SpinnerBlock label="Loading preview..." />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sand-50 px-6 text-center">
        <p className="text-sm text-red-600">{error || "Blog post not found."}</p>
        <Link to="/blogs" className="btn-outline btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to blogs
        </Link>
      </div>
    );
  }

  const minutes = readingTime(blog.content);

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="sticky top-0 z-50 border-b border-ink-950/10 bg-ink-950 text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to={`/blogs/${blog.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to editor
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300 sm:inline-flex">
              <Eye className="h-3.5 w-3.5" /> Preview mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={
                blog.status === "PUBLISHED"
                  ? "badge-status-published"
                  : "badge bg-white/10 text-white"
              }
            >
              {blog.status === "PUBLISHED" ? "Published" : "Draft"}
            </span>
            <Link to={`/blogs/${blog.id}/edit`} className="btn-primary btn-sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            {blog.status === "PUBLISHED" ? (
              <a
                href={publicSiteUrl(`/tours/${blog.slug}`)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline-light btn-sm hidden sm:inline-flex"
              >
                View live
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] font-medium text-amber-800">
        You are previewing this post as an administrator. Drafts are not visible to public
        visitors or search engines.
      </div>

      <header className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-ember-500/15 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-ember-500 text-white">{blog.genre}</span>
              {blog.featured ? (
                <span className="badge bg-white/10 text-white ring-1 ring-inset ring-white/15">
                  Featured
                </span>
              ) : null}
              {blog.tourName ? (
                <span className="badge bg-white/5 text-white/70 ring-1 ring-inset ring-white/10">
                  {blog.tourName}
                </span>
              ) : null}
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold uppercase leading-[0.94] tracking-tight sm:text-5xl">
              {blog.title}
            </h1>
            {blog.excerpt ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60">
                {blog.excerpt}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55">
              <span className="font-semibold text-white/85">{blog.artistName}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-ember-400" />
                {formatDate(blog.publishedAt || blog.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ember-400" /> {minutes} min read
              </span>
              {blog.tourStartDate || blog.tourEndDate ? (
                <span>{formatDateRange(blog.tourStartDate, blog.tourEndDate)}</span>
              ) : null}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-ink-800">
            {blog.featuredImage ? (
              <img
                src={assetUrl(blog.featuredImage)}
                alt={blog.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-ember-700 to-ink-950 text-sm text-white/50">
                No featured image
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article>
            {blog.content.trim() ? (
              <div
                className="prose-article"
                dangerouslySetInnerHTML={{ __html: article.html }}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-ink-950/15 bg-white px-6 py-16 text-center text-sm text-ink-600">
                No article content yet.
              </div>
            )}

            {blog.additionalImages.length > 0 ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {blog.additionalImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative aspect-[16/10] overflow-hidden rounded-xl border border-ink-950/[0.06]"
                  >
                    <img
                      src={assetUrl(src)}
                      alt={`Gallery image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {hasWidget ? (
              <section className="mt-12">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-ember-600" />
                  <h2 className="font-display text-2xl font-bold uppercase text-ink-950">
                    Concert Schedule
                  </h2>
                </div>
                <p className="mt-1 text-xs text-ink-600">
                  Rendered in the same sandboxed widget frame used on the public site.
                </p>
                <div className="mt-4">
                  {widgetLoading ? (
                    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-ink-950/15 bg-white">
                      <Spinner className="h-6 w-6 text-ember-500" />
                    </div>
                  ) : widgetError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
                      {widgetError}
                    </div>
                  ) : widgetHtml ? (
                    <WidgetFrame
                      srcDoc={widgetHtml}
                      title={`${blog.title} concert schedule preview`}
                    />
                  ) : null}
                </div>
              </section>
            ) : (
              <div className="mt-12 rounded-2xl border border-dashed border-ink-950/15 bg-white px-6 py-10 text-center">
                <Ticket className="mx-auto h-6 w-6 text-ink-600/40" />
                <p className="mt-3 text-sm font-medium text-ink-700">
                  Concert schedule is not enabled for this post.
                </p>
                <p className="mt-1 text-xs text-ink-600">
                  Add the TicketNetwork embed code in the editor to preview it here.
                </p>
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-ink-950/[0.07] bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-600">
                Post details
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-600">Slug</dt>
                  <dd className="truncate font-mono text-[11px] text-ink-900">/{blog.slug}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-600">Status</dt>
                  <dd className="font-semibold text-ink-900">{blog.status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-600">Widget</dt>
                  <dd className="font-semibold text-ink-900">{hasWidget ? "Enabled" : "Off"}</dd>
                </div>
              </dl>
            </div>
            <TableOfContents toc={article.toc} />
          </aside>
        </div>
      </div>
    </div>
  );
}
