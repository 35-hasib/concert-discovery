import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GENRES } from "../../lib/constants";

export function BlogFilters({
  initialQuery,
  initialStatus,
  initialGenre,
}: {
  initialQuery: string;
  initialStatus: string;
  initialGenre: string;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [genre, setGenre] = useState(initialGenre);

  useEffect(() => {
    setQ(initialQuery);
    setStatus(initialStatus);
    setGenre(initialGenre);
  }, [initialQuery, initialStatus, initialGenre]);

  function apply(next?: { q?: string; status?: string; genre?: string }) {
    const values = {
      q: next?.q ?? q,
      status: next?.status ?? status,
      genre: next?.genre ?? genre,
    };
    const params = new URLSearchParams();
    if (values.q.trim()) params.set("q", values.q.trim());
    if (values.status) params.set("status", values.status);
    if (values.genre) params.set("genre", values.genre);
    const query = params.toString();
    navigate(query ? `/blogs?${query}` : "/blogs");
  }

  const hasFilters = Boolean(q.trim() || status || genre);

  return (
    <div className="relative rounded-2xl border border-ink-950/[0.07] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="relative flex-1"
          role="search"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            type="search"
            placeholder="Search title, artist or tour"
            aria-label="Search blogs"
            className="input h-10 pl-11 text-sm"
          />
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                apply({ q: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-950"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </form>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label className="relative">
            <span className="sr-only">Status</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                apply({ status: event.target.value });
              }}
              className="select h-10 pl-9 text-sm"
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </label>

          <select
            value={genre}
            onChange={(event) => {
              setGenre(event.target.value);
              apply({ genre: event.target.value });
            }}
            aria-label="Filter by genre"
            className="select h-10 text-sm"
          >
            <option value="">All genres</option>
            {GENRES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => apply()} className="btn-dark h-10 px-5 text-xs">
            Filter
          </button>
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-3 flex items-center gap-2 border-t border-ink-950/[0.06] pt-2.5">
          <span className="text-[11px] font-semibold text-ink-600">Filters active</span>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setStatus("");
              setGenre("");
              navigate("/blogs");
            }}
            className="ml-auto text-xs font-semibold text-ember-600 underline underline-offset-2 hover:text-ember-700"
          >
            Reset all
          </button>
        </div>
      ) : null}
    </div>
  );
}
