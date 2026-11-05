import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  Disc3,
  Eye,
  History,
  Music2,
  Music4,
  Pencil,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { PublicBlogCard } from "../components/PublicBlogCard";
import { PublicShareButtons } from "../components/PublicShareButtons";
import { Spinner, SpinnerBlock } from "../components/Spinner";
import { WidgetFrame } from "../components/WidgetFrame";
import {
  api,
  assetUrl,
  errorMessage,
  publicSiteUrl,
} from "../lib/api";
import { prepareArticle } from "../lib/sanitize";
import type { Blog } from "../lib/types";
import { cn, formatDate, formatDateRange } from "../lib/utils";

const PUBLIC_GENRES = [
  "Rock",
  "Pop",
  "Country",
  "Hip-Hop / Rap",
  "Electronic",
  "Latin",
];

function PublicSection({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("mt-9 scroll-mt-6", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] uppercase leading-none text-[#535353] sm:text-[32px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[12px] leading-relaxed text-[#777777]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="rule-accent mt-2" />
      {children}
    </section>
  );
}

export function PreviewBlogPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [widgetHtml, setWidgetHtml] = useState("");
  const [widgetLoading, setWidgetLoading] = useState(false);
  const [widgetError, setWidgetError] = useState("");
  const [related, setRelated] = useState<Blog[]>([]);

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

  const hasWidget = Boolean(
    blog?.widgetEnabled && blog.widgetCode?.trim()
  );

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
    const blogId = blog.id;

    async function loadWidget() {
      try {
        const data = await api<{ html: string }>("/admin/widget-preview", {
          method: "POST",
          body: {
            code: widgetCode,
            title: blogTitle,
            blogId,
          },
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

  useEffect(() => {
    if (!blog || blog.status !== "PUBLISHED") {
      setRelated([]);
      return;
    }

    let cancelled = false;
    const blogId = blog.id;
    const slug = blog.slug;

    async function loadRelated() {
      try {
        const data = await api<{ related: Blog[]; moreByArtist: Blog[] }>(
          `/blogs/${encodeURIComponent(slug)}`,
          { auth: false }
        );
        if (cancelled) return;
        const seen = new Set<string>([blogId]);
        const items = [...(data.moreByArtist || []), ...(data.related || [])].filter(
          (item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }
        );
        setRelated(items.slice(0, 6));
      } catch {
        if (!cancelled) setRelated([]);
      }
    }

    void loadRelated();
    return () => {
      cancelled = true;
    };
  }, [blog?.id, blog?.slug, blog?.status]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dedddc]">
        <SpinnerBlock label="Loading preview..." />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#dedddc] px-6 text-center">
        <p className="text-sm text-red-600">{error || "Blog post not found."}</p>
        <Link to="/blogs" className="btn-outline btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to blogs
        </Link>
      </div>
    );
  }

  const publishedDate = blog.publishedAt || blog.createdAt;
  const tourWindow = formatDateRange(blog.tourStartDate, blog.tourEndDate);
  const tourYear =
    blog.tourYear ??
    (blog.tourStartDate
      ? new Date(blog.tourStartDate).getUTCFullYear()
      : new Date(publishedDate || blog.createdAt).getUTCFullYear());
  const hasTourNotes = blog.supportingArtists.length > 0 || Boolean(blog.previousTour);
  const primaryAlbum = blog.albums[0];
  const articleUrl = publicSiteUrl(`/tours/${blog.slug}`);
  const liveUrl = publicSiteUrl(`/tours/${blog.slug}`);

  return (
    <div className="min-h-screen bg-[#dedddc]">
      <div className="sticky top-0 z-50 border-b border-[#333333] bg-[#222222] text-white">
        <div className="mx-auto flex h-16 max-w-[1210px] items-center justify-between gap-4 px-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Link
              to={`/blogs/${blog.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to editor
            </Link>
            <span className="hidden items-center gap-1.5 rounded-[3px] bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300 sm:inline-flex">
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
                href={liveUrl}
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
        You are previewing this post as an administrator. Drafts are not visible to
        public visitors or search engines.
      </div>

      <div className="public-surface mx-auto my-5 max-w-[1210px] bg-white px-4 pb-12 pt-5 shadow-[0_1px_2px_rgba(9,9,12,0.06),0_12px_32px_-12px_rgba(9,9,12,0.18)] sm:px-5">
        <div className="grid gap-[30px] lg:grid-cols-[minmax(0,1fr)_370px]">
          <article id="content" className="min-w-0">
            <header>
              <h1 className="font-display text-[36px] uppercase leading-none text-[#535353] sm:text-[38px]">
                {blog.artistName}{" "}
                <span className="text-[#777777]">Tour Dates {tourYear}</span>
              </h1>
              <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[#999999]">
                <li className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-[#aaaaaa]" />
                  {tourWindow || "Dates to be announced"}
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Music4 className="h-3.5 w-3.5 text-[#aaaaaa]" />
                  <a
                    href={publicSiteUrl(`/tours?genre=${encodeURIComponent(blog.genre)}`)}
                    className="uppercase tracking-[0.06em] text-[#127794] hover:underline"
                  >
                    {blog.genre}
                  </a>
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#aaaaaa]" />
                  {blog.readingTime} min read
                </li>
              </ul>
              <div className="rule-accent mt-4" />
            </header>

            <div className="mt-4">
              {blog.featuredImage ? (
                <a
                  href={liveUrl}
                  className="mb-4 block overflow-hidden bg-[#222222] sm:float-left sm:mb-3 sm:mr-5 sm:w-[200px]"
                >
                  <img
                    src={assetUrl(blog.featuredImage)}
                    alt={blog.artistName}
                    className="h-[200px] w-full object-cover"
                  />
                </a>
              ) : null}
              <div className="text-[13px] leading-[1.8] text-[#535353]">
                <p>
                  <strong className="font-bold text-[#222222]">{blog.title}</strong>
                  {blog.excerpt ? ` — ${blog.excerpt}` : null}
                </p>
                {blog.tourName ? (
                  <p className="mt-2">
                    <b>Tour:</b> {blog.tourName}
                    {blog.supportingArtists.length > 0
                      ? ` · Special guests: ${blog.supportingArtists.join(", ")}`
                      : null}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="clear-both" />

            <div
              className="prose-article mt-4 [&>*:first-child]:mt-0"
              dangerouslySetInnerHTML={{ __html: article.html }}
            />

            {blog.additionalImages.length > 0 ? (
              <section className="mt-8" aria-labelledby="tour-gallery">
                <div className="flex items-end justify-between gap-3">
                  <h2
                    id="tour-gallery"
                    className="font-display text-[28px] uppercase leading-none text-[#535353]"
                  >
                    Tour Gallery
                  </h2>
                  <span className="text-[11px] text-[#999999]">
                    {blog.additionalImages.length} photos
                  </span>
                </div>
                <div className="rule-accent mt-2" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {blog.additionalImages.map((src, index) => (
                    <div
                      key={`${src}-${index}`}
                      className={cn(
                        "relative overflow-hidden rounded-[2px] bg-[#222222]",
                        index === 0 && blog.additionalImages.length > 2
                          ? "aspect-[16/9] sm:col-span-2"
                          : "aspect-[16/10]"
                      )}
                    >
                      <img
                        src={assetUrl(src)}
                        alt={`${blog.title} image ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <PublicSection
              id="concert-schedule"
              title={`${blog.artistName} Concert Schedule`}
              description="Browse upcoming dates and follow official ticket links to secure your seats."
            >
              <div className="mt-4">
                {hasWidget ? (
                  widgetLoading ? (
                    <div className="flex min-h-[280px] items-center justify-center rounded-[3px] border border-dashed border-[#cccccc] bg-[#fafafa]">
                      <Spinner className="h-6 w-6 text-[#1791c7]" />
                    </div>
                  ) : widgetError ? (
                    <div className="rounded-[3px] border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
                      {widgetError}
                    </div>
                  ) : widgetHtml ? (
                    <WidgetFrame
                      srcDoc={widgetHtml}
                      title={`${blog.title} concert schedule preview`}
                      className="rounded-[3px] border-[#dddddd]"
                    />
                  ) : null
                ) : (
                  <div className="rounded-[3px] border border-dashed border-[#cccccc] bg-[#fafafa] px-6 py-14 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7fc] text-[#127794]">
                      <Ticket className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 font-display text-2xl uppercase text-[#535353]">
                      Ticket links coming soon
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#777777]">
                      Official dates for this tour are not available yet. Check back
                      soon or explore other announced tours.
                    </p>
                    <a
                      href={publicSiteUrl("/tours")}
                      className="btn-primary mt-5"
                    >
                      Browse all tours <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-[#999999]">
                Concert listings and ticket links are provided by the official tour
                partner. Availability and prices are set by the ticketing provider.
              </p>
            </PublicSection>

            {hasTourNotes ? (
              <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Tour notes">
                {blog.supportingArtists.length > 0 ? (
                  <div className="border border-[#e5e5e5] bg-white p-4">
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#127794]">
                      <Users className="h-3.5 w-3.5" /> On the bill
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {blog.supportingArtists.map((artist) => (
                        <span
                          key={artist}
                          className="rounded-[2px] bg-[#f5f5f5] px-2 py-1 text-[11px] font-bold text-[#535353]"
                        >
                          {artist}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {blog.previousTour ? (
                  <div className="border border-[#e5e5e5] bg-white p-4">
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#127794]">
                      <History className="h-3.5 w-3.5" /> Previously on the road
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#535353]">
                      {blog.previousTour}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {blog.tourCities.length > 0 ? (
              <section className="mt-8" aria-labelledby="tour-cities">
                <h2
                  id="tour-cities"
                  className="font-display text-[28px] uppercase leading-none text-[#535353]"
                >
                  Cities on this tour
                </h2>
                <div className="rule-accent mt-2" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {blog.tourCities.map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#e5e5e5] bg-white px-3 py-1.5 text-[11px] text-[#535353]"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-[#eeeeee] py-4">
              <PublicShareButtons url={articleUrl} title={blog.title} compact />
              <span className="text-[11px] text-[#999999]">
                Published {formatDate(publishedDate)} · {blog.genre}
              </span>
            </div>
          </article>

          <aside className="space-y-5" aria-label="Tour sidebar">
            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                  {blog.artistName} Albums
                </h2>
              </div>
              <div className="p-4">
                {primaryAlbum ? (
                  <div className="flex gap-3">
                    <div className="relative h-[130px] w-[130px] shrink-0 overflow-hidden rounded-[2px] bg-[#222222]">
                      {primaryAlbum.cover ? (
                        <img
                          src={assetUrl(primaryAlbum.cover)}
                          alt={`${primaryAlbum.title} album cover`}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col justify-between bg-gradient-to-br from-[#1791c7] to-[#222222] p-3 text-white">
                          <Disc3 className="h-5 w-5 text-white/70" />
                          <p className="font-display text-lg uppercase leading-none">
                            {primaryAlbum.title}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xl uppercase leading-none text-[#535353]">
                        {primaryAlbum.title}
                      </p>
                      {primaryAlbum.year ? (
                        <p className="mt-1 text-[11px] text-[#999999]">
                          {primaryAlbum.year}
                        </p>
                      ) : null}
                      {primaryAlbum.tracks.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {primaryAlbum.tracks.slice(0, 3).map((track) => (
                            <li
                              key={track}
                              className="truncate text-[11px] text-[#777777]"
                            >
                              · {track}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#777777]">
                    Album details have not been added yet.
                  </p>
                )}
                {blog.albums.length > 0 ? (
                  <a
                    href="#tour-albums"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#127794] hover:underline"
                  >
                    View all albums <ChevronRight className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                  Tour Details
                </h2>
              </div>
              <dl className="divide-y divide-[#f0f0f0] px-4 py-2 text-xs">
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Artist</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {blog.artistName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Genre</dt>
                  <dd className="text-right font-bold text-[#535353]">{blog.genre}</dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Dates</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {tourWindow || "To be announced"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Cities</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {blog.tourCities.length || "—"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Albums</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {blog.albums.length || "—"}
                  </dd>
                </div>
              </dl>
              <div className="px-4 pb-4">
                <a href="#concert-schedule" className="btn-primary w-full">
                  <Ticket className="h-4 w-4" /> View schedule
                </a>
              </div>
            </div>

            <div className="bg-[#1791c7] p-5 text-white">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                <ShieldCheck className="h-3.5 w-3.5" /> Official ticket links
              </p>
              <h2 className="mt-1 font-display text-[26px] uppercase leading-none text-white">
                Plan your night
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
                Dates and ticket links are provided by our official tour partner. Always
                check the venue and provider before purchasing.
              </p>
              <a
                href={publicSiteUrl("/contact")}
                className="mt-3 inline-flex h-8 items-center justify-center rounded-[3px] bg-white px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#333333] transition hover:bg-[#222222] hover:text-white"
              >
                Contact us <ChevronRight className="h-3 w-3" />
              </a>
            </div>

            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                  Browse by Genre
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {PUBLIC_GENRES.map((genre) => (
                  <a
                    key={genre}
                    href={publicSiteUrl(`/tours?genre=${encodeURIComponent(genre)}`)}
                    className={cn(
                      "rounded-[2px] px-2.5 py-1.5 text-[11px] transition",
                      genre === blog.genre
                        ? "bg-[#1791c7] text-white"
                        : "bg-[#f5f5f5] text-[#535353] hover:bg-[#eaf7fc] hover:text-[#127794]"
                    )}
                  >
                    {genre}
                  </a>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <PublicShareButtons url={articleUrl} title={blog.title} />
            </div>

            <div className="border border-[#e5e5e5] bg-white p-4">
              <h2 className="flex items-center gap-2 font-display text-xl uppercase leading-none text-[#535353]">
                <Music2 className="h-4 w-4 text-[#127794]" /> More live music
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Explore every published tour announcement and find your next show.
              </p>
              <a
                href={publicSiteUrl("/tours")}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#127794] hover:underline"
              >
                All tours <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          </aside>
        </div>

        {blog.albums.length > 0 ? (
          <PublicSection
            id="tour-albums"
            title="Albums & Popular Songs"
            description="Get familiar with the records behind the setlist before the show."
            className="border-t border-[#eeeeee] pt-8"
            action={
              <span className="text-[11px] text-[#999999]">
                {blog.albums.length} releases
              </span>
            }
          >
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {blog.albums.map((album, index) => (
                <article
                  key={`${album.title}-${index}`}
                  className="flex overflow-hidden border border-[#e5e5e5] bg-white"
                >
                  <div className="relative aspect-square w-[110px] shrink-0 bg-[#222222]">
                    {album.cover ? (
                      <img
                        src={assetUrl(album.cover)}
                        alt={`${album.title} album cover`}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-between bg-gradient-to-br from-[#1791c7] to-[#222222] p-3 text-white">
                        <Disc3 className="h-5 w-5 text-white/70" />
                        <p className="font-display text-base uppercase leading-none">
                          {album.title}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl uppercase leading-none text-[#535353]">
                        {album.title}
                      </h3>
                      {album.year ? (
                        <span className="shrink-0 text-[10px] text-[#999999]">
                          {album.year}
                        </span>
                      ) : null}
                    </div>
                    {album.description ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#777777]">
                        {album.description}
                      </p>
                    ) : null}
                    {album.tracks.length > 0 ? (
                      <p className="mt-2 truncate text-[10px] text-[#999999]">
                        {album.tracks.slice(0, 3).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </PublicSection>
        ) : null}

        {related.length > 0 ? (
          <PublicSection
            id="related-tours"
            title="Related Tours"
            description={`More announcements from ${blog.artistName} and artists in ${blog.genre}.`}
            className="border-t border-[#eeeeee] pt-8"
            action={
              <a
                href={publicSiteUrl("/tours")}
                className="btn-outline btn-sm"
              >
                View all tours
              </a>
            }
          >
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PublicBlogCard key={item.id} blog={item} />
              ))}
            </div>
          </PublicSection>
        ) : null}
      </div>
    </div>
  );
}
