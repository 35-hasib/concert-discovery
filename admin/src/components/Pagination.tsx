import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../lib/utils";

function pageHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  basePath,
  currentPage,
  totalPages,
  params,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  const windowSize = 1;
  for (let page = 1; page <= totalPages; page += 1) {
    if (
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - windowSize && page <= currentPage + windowSize)
    ) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          to={pageHref(basePath, params, currentPage - 1)}
          className="flex h-9 items-center gap-1.5 rounded-full border border-ink-950/10 bg-white px-3.5 text-xs font-semibold text-ink-700 transition hover:border-ink-950/30"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Link>
      ) : (
        <span className="flex h-9 items-center gap-1.5 rounded-full border border-ink-950/5 px-3.5 text-xs font-semibold text-ink-600/40">
          <ChevronLeft className="h-4 w-4" /> Prev
        </span>
      )}

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-ink-600">
            …
          </span>
        ) : (
          <Link
            key={page}
            to={pageHref(basePath, params, page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition",
              page === currentPage
                ? "bg-ink-950 text-white"
                : "border border-ink-950/10 bg-white text-ink-700 hover:border-ink-950/30"
            )}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          to={pageHref(basePath, params, currentPage + 1)}
          className="flex h-9 items-center gap-1.5 rounded-full border border-ink-950/10 bg-white px-3.5 text-xs font-semibold text-ink-700 transition hover:border-ink-950/30"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 items-center gap-1.5 rounded-full border border-ink-950/5 px-3.5 text-xs font-semibold text-ink-600/40">
          Next <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
