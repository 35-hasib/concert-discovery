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
          className="flex h-10 items-center gap-1.5 rounded-[3px] border border-[#dddddd] bg-white px-4 text-xs font-semibold text-[#535353] transition hover:border-ember-500 hover:text-ember-600"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Link>
      ) : (
        <span className="flex h-10 items-center gap-1.5 rounded-[3px] border border-[#eeeeee] px-4 text-xs font-semibold text-[#bbbbbb]">
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
              "flex h-10 w-10 items-center justify-center rounded-[3px] text-xs font-bold transition",
              page === currentPage
                ? "bg-ember-500 text-white"
                : "border border-[#dddddd] bg-white text-[#535353] hover:border-ember-500 hover:text-ember-600"
            )}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          to={pageHref(basePath, params, currentPage + 1)}
          className="flex h-10 items-center gap-1.5 rounded-[3px] border border-[#dddddd] bg-white px-4 text-xs font-semibold text-[#535353] transition hover:border-ember-500 hover:text-ember-600"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-10 items-center gap-1.5 rounded-[3px] border border-[#eeeeee] px-4 text-xs font-semibold text-[#bbbbbb]">
          Next <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
