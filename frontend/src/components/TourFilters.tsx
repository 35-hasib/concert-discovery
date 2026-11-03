import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GENRES, SORT_OPTIONS } from "../lib/constants";
import type { SortOption } from "../lib/types";
import { Spinner } from "./Spinner";

type Props = {
  initialQuery: string;
  initialGenre: string;
  initialSort: SortOption;
  pending?: boolean;
};

export function TourFilters({ initialQuery, initialGenre, initialSort, pending = false }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const [genre, setGenre] = useState(initialGenre);
  const [sort, setSort] = useState<SortOption>(initialSort);

  useEffect(() => setQ(initialQuery), [initialQuery]);
  useEffect(() => setGenre(initialGenre), [initialGenre]);
  useEffect(() => setSort(initialSort), [initialSort]);

  function apply(next?: { q?: string; genre?: string; sort?: SortOption }) {
    const values = {
      q: next?.q ?? q,
      genre: next?.genre ?? genre,
      sort: next?.sort ?? sort,
    };
    const params = new URLSearchParams();
    if (values.q.trim()) params.set("q", values.q.trim());
    if (values.genre) params.set("genre", values.genre);
    if (values.sort !== "newest") params.set("sort", values.sort);
    const query = params.toString();
    navigate(query ? `/tours?${query}` : "/tours");
  }

  const hasFilters = Boolean(q.trim() || genre || sort !== "newest");

  return (
    <div className="relative border-b border-[#e5e5e5] py-4">
      {pending ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
          <Spinner className="h-5 w-5 text-ember-500" />
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
        role="search"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            type="search"
            placeholder="Search by artist, tour or title"
            aria-label="Search tours"
            className="input h-11 pl-11"
          />
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                apply({ q: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] transition hover:text-[#333333]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <label className="relative">
            <span className="sr-only">Filter by genre</span>
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
            <select
              value={genre}
              onChange={(event) => {
                const value = event.target.value;
                setGenre(value);
                apply({ genre: value });
              }}
              className="select h-11 pl-10"
            >
              <option value="">All genres</option>
              {GENRES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="relative">
            <span className="sr-only">Sort tours</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
            <select
              value={sort}
              onChange={(event) => {
                const value = event.target.value as SortOption;
                setSort(value);
                apply({ sort: value });
              }}
              className="select h-11 pl-10"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "newest" ? "Newest first" : "Oldest first"}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="btn-dark h-11 px-6 text-xs">
            Apply
          </button>
        </div>
      </form>

      {hasFilters ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#eeeeee] pt-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999999]">
            Active
          </span>
          {q.trim() ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                apply({ q: "" });
              }}
              className="inline-flex items-center gap-1 rounded-[2px] bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#535353] hover:bg-[#eeeeee]"
            >
              “{q.trim()}” <X className="h-3 w-3" />
            </button>
          ) : null}
          {genre ? (
            <button
              type="button"
              onClick={() => {
                setGenre("");
                apply({ genre: "" });
              }}
              className="inline-flex items-center gap-1 rounded-[2px] bg-ember-50 px-3 py-1 text-xs font-medium text-ember-700 hover:bg-ember-100"
            >
              {genre} <X className="h-3 w-3" />
            </button>
          ) : null}
          {sort !== "newest" ? (
            <button
              type="button"
              onClick={() => {
                setSort("newest");
                apply({ sort: "newest" });
              }}
              className="inline-flex items-center gap-1 rounded-[2px] bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#535353] hover:bg-[#eeeeee]"
            >
              Oldest first <X className="h-3 w-3" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setQ("");
              setGenre("");
              setSort("newest");
              navigate("/tours");
            }}
            className="ml-auto text-xs font-semibold text-[#777777] underline underline-offset-2 hover:text-[#333333]"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
