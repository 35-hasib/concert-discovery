import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  Disc3,
  History,
  MapPin,
  Music2,
  Music4,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { BlogCard } from "../components/BlogCard";
import { ShareButtons } from "../components/ShareButtons";
import { Spinner } from "../components/Spinner";
import { ConcertSchedule, hasConcertSchedule } from "../components/ConcertSchedule";
import { useSiteSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";
import { absoluteUrl, api, ApiError, assetUrl } from "../lib/api";
import { prepareArticle } from "../lib/sanitize";
import type { BlogDetailResult } from "../lib/types";
import { cn, formatDate, formatDateRange, stripHtml } from "../lib/utils";

export function TourDetailPage() {
  const { slug = "" } = useParams();
  const { settings } = useSiteSettings();
  const [data, setData] = useState<BlogDetailResult | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const lifecycle = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function fetchTour() {
      const attemptController = new AbortController();
      const onLifecycleAbort = () => attemptController.abort();
      lifecycle.signal.addEventListener("abort", onLifecycleAbort, { once: true });
      const timeout = setTimeout(() => attemptController.abort(), 20000);
      try {
        return await api<BlogDetailResult>(`/blogs/${encodeURIComponent(slug)}`, {
          signal: attemptController.signal,
        });
      } finally {
        clearTimeout(timeout);
        lifecycle.signal.removeEventListener("abort", onLifecycleAbort);
      }
    }

    async function load() {
      setState("loading");
      setError("");
      const retries = 2;
      let lastError: unknown = null;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          const result = await fetchTour();
          if (!active) return;
          setData(result);
          setState("ready");
          return;
        } catch (err) {
          if (!active) return;
          if (err instanceof ApiError && err.status === 404) {
            setState("notfound");
            return;
          }
          lastError = err;
          if (attempt < retries) {
            await new Promise<void>((resolve) => {
              timer = setTimeout(resolve, 1200 * (attempt + 1));
            });
            if (!active) return;
          }
        }
      }
      if (!active) return;
      setError(lastError instanceof ApiError ? lastError.message : "The announcement could not be loaded.");
      setState("error");
    }

    load();
    return () => {
      active = false;
      lifecycle.abort();
      if (timer) clearTimeout(timer);
    };
  }, [slug, reload]);

  const blog = data?.blog;
  const article = useMemo(() => prepareArticle(blog?.content || ""), [blog?.content]);
  const publishedDate = blog ? blog.publishedAt || blog.createdAt : null;
  const articleUrl = absoluteUrl(`/tours/${slug}`);
  const image = blog?.featuredImage ? absoluteUrl(blog.featuredImage) : absoluteUrl("/icon.svg");
  const hasWidget = Boolean(blog && hasConcertSchedule(blog));
  const relatedTours = useMemo(() => {
    const seen = new Set<string>();
    if (blog) seen.add(blog.id);
    return [...(data?.moreByArtist || []), ...(data?.related || [])].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [blog, data?.moreByArtist, data?.related]);

  const articleSchema = blog
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: blog.title,
        description:
          blog.metaDescription || blog.excerpt || stripHtml(blog.content).slice(0, 200),
        image: [image],
        datePublished: new Date(publishedDate || blog.createdAt).toISOString(),
        dateModified: new Date(blog.updatedAt).toISOString(),
        author: { "@type": "Person", name: blog.artistName || settings.websiteName },
        publisher: {
          "@type": "Organization",
          name: settings.websiteName,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl(settings.logo || "/icon.svg"),
          },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
        articleSection: blog.tourName || blog.genre,
        keywords: blog.seoKeywords || undefined,
        about: {
          "@type": "MusicGroup",
          name: blog.artistName,
          genre: blog.genre,
        },
      }
    : null;

  const breadcrumbSchema = blog
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "All Tours", item: absoluteUrl("/tours") },
          { "@type": "ListItem", position: 3, name: blog.title, item: articleUrl },
        ],
      }
    : null;

  const albumSchema =
    blog && blog.albums.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${blog.artistName} albums`,
          itemListElement: blog.albums.map((album, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "MusicAlbum",
              name: album.title,
              datePublished: album.year || undefined,
              image: album.cover ? absoluteUrl(album.cover) : undefined,
              numTracks: album.tracks.length || undefined,
              byArtist: { "@type": "MusicGroup", name: blog.artistName },
            },
          })),
        }
      : null;

  const nextConcert = blog?.scheduleSummary?.nextConcert;
  const nextConcertDate = nextConcert?.date ? new Date(nextConcert.date) : null;
  const eventSchema =
    blog && nextConcert && nextConcertDate && !Number.isNaN(nextConcertDate.getTime()) && nextConcert.city
      ? {
          "@context": "https://schema.org",
          "@type": "MusicEvent",
          name: `${blog.artistName} live in ${nextConcert.city}`,
          startDate: nextConcertDate.toISOString(),
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: nextConcert.venue || nextConcert.city,
            address: { "@type": "PostalAddress", addressLocality: nextConcert.city },
          },
          performer: { "@type": "MusicGroup", name: blog.artistName },
          url: articleUrl,
          image: [image],
        }
      : null;

  const structuredData: Record<string, unknown>[] = [];
  if (articleSchema) structuredData.push(articleSchema);
  if (breadcrumbSchema) structuredData.push(breadcrumbSchema);
  if (albumSchema) structuredData.push(albumSchema);
  if (eventSchema) structuredData.push(eventSchema);

  useSeo({
    title: blog
      ? `${blog.metaTitle || `${blog.title} by ${blog.artistName}`} | ${settings.websiteName}`
      : `Tour announcement | ${settings.websiteName}`,
    description:
      blog?.metaDescription ||
      blog?.excerpt ||
      (blog ? stripHtml(blog.content).slice(0, 160) : "Concert tour announcement."),
    path: `/tours/${slug}`,
    image,
    imageAlt: blog?.title || "Tour announcement",
    type: "article",
    keywords: blog?.seoKeywords,
    noindex: state === "notfound" || state === "error",
    publishedTime: blog ? new Date(publishedDate || blog.createdAt).toISOString() : undefined,
    modifiedTime: blog ? new Date(blog.updatedAt).toISOString() : undefined,
    jsonLd: structuredData.length > 0 ? structuredData : undefined,
  });

  if (state === "notfound") {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center bg-white px-5 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ember-50 text-ember-600">
          <Ticket className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-4xl uppercase text-[#535353]">Tour not found</h1>
        <p className="mt-2 max-w-md text-sm text-[#777777]">
          This announcement does not exist, was unpublished, or moved to a new URL.
        </p>
        <Link to="/tours" className="btn-primary mt-6">
          Browse all tours
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center bg-white px-5 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Ticket className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-4xl uppercase text-[#535353]">
          Could not load this tour
        </h1>
        <p className="mt-2 max-w-md text-sm text-[#777777]">{error}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setReload((value) => value + 1)} className="btn-primary">
            Try again
          </button>
          <Link to="/tours" className="btn-outline">
            All tours
          </Link>
        </div>
      </div>
    );
  }

  if (state === "loading" || !blog) {
    return (
      <div className="container-page bg-white px-5 py-5">
        <div className="skeleton h-[34px] w-full rounded-none" />
        <div className="mt-5 grid gap-[30px] lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-4">
            <div className="skeleton h-10 w-3/4" />
            <div className="skeleton h-4 w-52" />
            <div className="rule-accent my-5" />
            <div className="skeleton aspect-[16/7] w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-4/5" />
            <div className="flex items-center gap-3 py-8 text-sm text-[#777777]">
              <Spinner className="h-5 w-5 text-ember-500" /> Loading tour details…
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-64 rounded-[3px]" />
            <div className="skeleton h-40 rounded-[3px]" />
          </div>
        </div>
      </div>
    );
  }

  const tourWindow = formatDateRange(blog.tourStartDate, blog.tourEndDate);
  const tourYear =
    blog.tourYear ??
    (blog.tourStartDate
      ? new Date(blog.tourStartDate).getUTCFullYear()
      : new Date(publishedDate || blog.createdAt).getUTCFullYear());
  const hasTourNotes = blog.supportingArtists.length > 0 || Boolean(blog.previousTour);
  const primaryAlbum = blog.albums[0];

  return (
    <div className="container-page bg-white px-5 pb-12 pt-5">
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
                <Link
                  to={`/tours?genre=${encodeURIComponent(blog.genre)}`}
                  className="uppercase tracking-[0.06em] text-ember-600 hover:underline"
                >
                  {blog.genre}
                </Link>
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
              <Link
                to={`/tours/${blog.slug}`}
                className="mb-4 block overflow-hidden bg-[#222222] sm:float-left sm:mb-3 sm:mr-5 sm:w-[200px]"
              >
                <img
                  src={assetUrl(blog.featuredImage)}
                  alt={blog.artistName}
                  className="h-[200px] w-full object-cover"
                />
              </Link>
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
                <h2 id="tour-gallery" className="font-display text-[28px] uppercase leading-none text-[#535353]">
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

          <section id="concert-schedule" className="mt-9 scroll-mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-[32px] uppercase leading-none text-[#535353]">
                  {blog.artistName} Concert Schedule
                </h2>
                <p className="mt-1 text-[12px] text-[#777777]">
                  Browse upcoming dates and follow official ticket links to secure your seats.
                </p>
              </div>
            </div>
            <div className="rule-accent mt-2" />
            <div className="mt-4">
              {hasWidget ? (
                <ConcertSchedule
                  blog={blog}
                  className="rounded-[3px] border-[#dddddd]"
                />
              ) : (
                <div className="rounded-[3px] border border-dashed border-[#cccccc] bg-[#fafafa] px-6 py-14 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ember-50 text-ember-600">
                    <Ticket className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-display text-2xl uppercase text-[#535353]">
                    Ticket links coming soon
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#777777]">
                    Official dates for this tour are not available yet. Check back soon or explore
                    other announced tours.
                  </p>
                  <Link to="/tours" className="btn-primary mt-5">
                    Browse all tours <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-[#999999]">
              Concert listings and ticket links are provided by the official tour partner.
              Availability and prices are set by the ticketing provider.
            </p>
          </section>

          {hasTourNotes ? (
            <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Tour notes">
              {blog.supportingArtists.length > 0 ? (
                <div className="border border-[#e5e5e5] bg-white p-4">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ember-600">
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
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ember-600">
                    <History className="h-3.5 w-3.5" /> Previously on the road
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#535353]">{blog.previousTour}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {blog.tourCities.length > 0 ? (
            <section className="mt-8" aria-labelledby="tour-cities">
              <h2 id="tour-cities" className="font-display text-[28px] uppercase leading-none text-[#535353]">
                Cities on this tour
              </h2>
              <div className="rule-accent mt-2" />
              <div className="mt-3 flex flex-wrap gap-2">
                {blog.tourCities.map((city) => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#e5e5e5] bg-white px-3 py-1.5 text-[11px] text-[#535353]"
                  >
                    <MapPin className="h-3 w-3 text-ember-600" /> {city}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-[#eeeeee] py-4">
            <ShareButtons url={articleUrl} title={blog.title} compact />
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
                      <div className="flex h-full flex-col justify-between bg-gradient-to-br from-ember-600 to-[#222222] p-3 text-white">
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
                      <p className="mt-1 text-[11px] text-[#999999]">{primaryAlbum.year}</p>
                    ) : null}
                    {primaryAlbum.tracks.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {primaryAlbum.tracks.slice(0, 3).map((track) => (
                          <li key={track} className="truncate text-[11px] text-[#777777]">
                            · {track}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#777777]">Album details have not been added yet.</p>
              )}
              {blog.albums.length > 0 ? (
                <a
                  href="#tour-albums"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-ember-600 hover:underline"
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
                <dd className="text-right font-bold text-[#535353]">{blog.artistName}</dd>
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
                <dd className="text-right font-bold text-[#535353]">{blog.albums.length || "—"}</dd>
              </div>
            </dl>
            <div className="px-4 pb-4">
              <a href="#concert-schedule" className="btn-primary w-full">
                <Ticket className="h-4 w-4" /> View schedule
              </a>
            </div>
          </div>

          <div className="bg-ember-500 p-5 text-white">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
              <ShieldCheck className="h-3.5 w-3.5" /> Official ticket links
            </p>
            <h2 className="mt-1 font-display text-[26px] uppercase leading-none text-white">
              Plan your night
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              Dates and ticket links are provided by our official tour partner. Always check the
              venue and provider before purchasing.
            </p>
            <Link
              to="/contact"
              className="mt-3 inline-flex h-8 items-center justify-center rounded-[3px] bg-white px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#333333] transition hover:bg-[#222222] hover:text-white"
            >
              Contact us <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="border border-[#e5e5e5] bg-white">
            <div className="border-b border-[#eeeeee] px-4 py-3">
              <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                Browse by Genre
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {["Rock", "Pop", "Country", "Hip-Hop / Rap", "Electronic", "Latin"].map((genre) => (
                <Link
                  key={genre}
                  to={`/tours?genre=${encodeURIComponent(genre)}`}
                  className={cn(
                    "rounded-[2px] px-2.5 py-1.5 text-[11px] transition",
                    genre === blog.genre
                      ? "bg-ember-500 text-white"
                      : "bg-[#f5f5f5] text-[#535353] hover:bg-ember-50 hover:text-ember-600"
                  )}
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <ShareButtons url={articleUrl} title={blog.title} />
          </div>

          <div className="border border-[#e5e5e5] bg-white p-4">
            <h2 className="flex items-center gap-2 font-display text-xl uppercase leading-none text-[#535353]">
              <Music2 className="h-4 w-4 text-ember-600" /> More live music
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#777777]">
              Explore every published tour announcement and find your next show.
            </p>
            <Link
              to="/tours"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-ember-600 hover:underline"
            >
              All tours <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>

      {blog.albums.length > 0 ? (
        <section id="tour-albums" className="mt-10 scroll-mt-6 border-t border-[#eeeeee] pt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[32px] uppercase leading-none text-[#535353]">
                Albums &amp; Popular Songs
              </h2>
              <p className="mt-1 text-[12px] text-[#777777]">
                Get familiar with the records behind the setlist before the show.
              </p>
            </div>
            <span className="text-[11px] text-[#999999]">{blog.albums.length} releases</span>
          </div>
          <div className="rule-accent mt-2" />
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
                    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-ember-600 to-[#222222] p-3 text-white">
                      <Disc3 className="h-5 w-5 text-white/70" />
                      <p className="font-display text-base uppercase leading-none">{album.title}</p>
                    </div>
                  )}
                </div>
                <div className="min-w-0 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-xl uppercase leading-none text-[#535353]">
                      {album.title}
                    </h3>
                    {album.year ? (
                      <span className="shrink-0 text-[10px] text-[#999999]">{album.year}</span>
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
        </section>
      ) : null}

      {relatedTours.length > 0 ? (
        <section className="mt-10 border-t border-[#eeeeee] pt-8" aria-labelledby="related-tours">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="related-tours" className="font-display text-[32px] uppercase leading-none text-[#535353]">
                Related Tours
              </h2>
              <p className="mt-1 text-[12px] text-[#777777]">
                More announcements from {blog.artistName} and artists in {blog.genre}.
              </p>
            </div>
            <Link to="/tours" className="btn-outline btn-sm">
              View all tours
            </Link>
          </div>
          <div className="rule-accent mt-2" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTours.slice(0, 6).map((item) => (
              <BlogCard key={item.id} blog={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
