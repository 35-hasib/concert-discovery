import { CalendarDays, ChevronRight, Music4, SearchX, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { PerformerCard } from "../components/PerformerCard";
import { Pagination } from "../components/Pagination";
import { Spinner } from "../components/Spinner";
import { TourFilters } from "../components/TourFilters";
import { useSiteSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";
import { api, ApiError } from "../lib/api";
import { GENRES } from "../lib/constants";
import type { BlogListResult, SortOption } from "../lib/types";

function parseFilters(searchParams: URLSearchParams) {
  const q = (searchParams.get("q") || "").slice(0, 120);
  const genreRaw = searchParams.get("genre") || "";
  const genre = (GENRES as readonly string[]).includes(genreRaw) ? genreRaw : "";
  const sort: SortOption = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const pageRaw = Number(searchParams.get("page") || 1);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  return { q, genre, sort, page };
}

export function ToursPage() {
  const { settings } = useSiteSettings();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const { q, genre, sort, page } = useMemo(
    () => parseFilters(new URLSearchParams(searchKey)),
    [searchKey]
  );

  const [result, setResult] = useState<BlogListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const filtered = Boolean(q || genre || sort !== "newest" || page > 1);
  const title = genre ? `${genre} Tours` : q ? `Search: ${q}` : "All Concert Tours";

  useSeo({
    title: `${title} | ${settings.websiteName}`,
    description:
      "Browse every published concert tour announcement. Filter by genre, search by artist and find your next live show.",
    path: "/tours",
    noindex: filtered,
  });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre) params.set("genre", genre);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    setLoading(true);
    setError("");
    api<BlogListResult>(`/blogs?${params.toString()}`, { signal: controller.signal })
      .then(setResult)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "We could not load the tours right now.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [q, genre, sort, page, reload]);

  const start = !result || result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const end = result ? Math.min(result.page * result.pageSize, result.total) : 0;
  const heading = q ? `Results for “${q}”` : genre ? `${genre} Tours` : "All Concert Tours";

  return (
    <div className="container-page bg-white px-5 pb-12 pt-5">
      <nav
        className="flex flex-wrap items-center gap-1.5 rounded-[2px] bg-[#f5f5f5] px-[15px] py-2 text-[11px] text-[#888888]"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="transition hover:text-ember-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-[#bbbbbb]" />
        <span className="text-[#555555]">{genre || q ? heading : "All Tours"}</span>
      </nav>

      <section className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ember-600">
              <Music4 className="h-3.5 w-3.5" /> Tour directory
            </p>
            <h1 className="mt-1.5 font-display text-[38px] uppercase leading-none text-[#535353]">
              {genre ? `${genre} Tours` : "All Concert Tours"}
            </h1>
            <p className="mt-2 max-w-2xl text-[12px] leading-[1.6] text-[#535353]">
              Every published tour announcement in one place. Search, filter and find the show
              that fits your playlist.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 border border-[#e5e5e5] bg-white px-3 py-2 text-[11px] text-[#777777]">
            <Ticket className="h-3.5 w-3.5 text-ember-600" />
            <span className="font-bold text-[#535353]">{result?.total ?? 0}</span> published tour
            {(result?.total ?? 0) === 1 ? "" : "s"}
          </div>
        </div>
        <div className="rule-accent mt-4" />
        <TourFilters initialQuery={q} initialGenre={genre} initialSort={sort} pending={loading} />
      </section>

      <section className="pt-8" aria-live="polite">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[30px] uppercase leading-none text-[#535353]">
              {heading}
            </h2>
            {q || genre ? (
              <p className="mt-1 text-[11px] text-[#999999]">
                {genre ? `Filtered by ${genre}` : null}
                {genre && q ? " · " : null}
                {q ? `Search term “${q}”` : null}
              </p>
            ) : null}
          </div>
          {result && result.total > 0 ? (
            <p className="inline-flex items-center gap-1.5 text-[11px] text-[#999999]">
              <CalendarDays className="h-3.5 w-3.5" />
              Showing{" "}
              <span className="font-bold text-[#535353]">
                {start}–{end}
              </span>{" "}
              of <span className="font-bold text-[#535353]">{result.total}</span>
            </p>
          ) : null}
        </div>

        {!result && loading ? (
          <div className="mt-5 grid gap-[15px] sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton aspect-[5/6] rounded-[3px]" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-5 flex flex-col items-center justify-center border border-dashed border-red-200 bg-white px-6 py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <SearchX className="h-7 w-7" />
            </span>
            <h3 className="mt-5 font-display text-3xl uppercase text-[#535353]">
              Could not load tours
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#777777]">{error}</p>
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              className="btn-primary mt-6"
            >
              {loading ? <Spinner className="h-4 w-4" /> : null} Try again
            </button>
          </div>
        ) : result && result.items.length > 0 ? (
          <>
            <div className="mt-5 grid gap-[15px] sm:grid-cols-2 lg:grid-cols-4">
              {result.items.map((blog, index) => (
                <PerformerCard key={blog.id} blog={blog} priority={index < 3} />
              ))}
            </div>
            <Pagination
              basePath="/tours"
              currentPage={result.page}
              totalPages={result.totalPages}
              params={{ q, genre, sort: sort === "newest" ? "" : sort }}
            />
          </>
        ) : (
          <div className="mt-5 flex flex-col items-center justify-center border border-dashed border-[#cccccc] bg-[#fafafa] px-6 py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ember-50 text-ember-600">
              <SearchX className="h-7 w-7" />
            </span>
            <h3 className="mt-5 font-display text-3xl uppercase text-[#535353]">No tours found</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#777777]">
              We could not find any published tours matching your filters. Try a different
              artist, genre or search term.
            </p>
            <Link to="/tours" className="btn-primary mt-6">
              Clear filters
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
