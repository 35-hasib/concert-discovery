import { ArrowRight, CalendarDays, Star } from "lucide-react";

import { assetUrl, publicSiteUrl } from "../lib/api";
import type { Blog, ScheduleSummary } from "../lib/types";
import { cn, formatDate, formatDateShort } from "../lib/utils";

const GENRE_GRADIENTS: Record<string, string> = {
  Rock: "from-[#1f2933] via-[#334155] to-[#1791c7]",
  Pop: "from-[#26314a] via-[#3b4c78] to-[#6d8ed6]",
  Country: "from-[#2e2a24] via-[#5c5040] to-[#b89b6a]",
  "Hip-Hop / Rap": "from-[#18181b] via-[#2f2f3a] to-[#7c6bd6]",
  "R&B": "from-[#2a1f2c] via-[#533b59] to-[#b279a5]",
  Electronic: "from-[#06222b] via-[#0a4a5c] to-[#22b8d6]",
  "Jazz / Blues": "from-[#17202e] via-[#2b4260] to-[#9fb6c9]",
  Classical: "from-[#24221d] via-[#4a4439] to-[#a99b7f]",
  Alternative: "from-[#1d2026] via-[#333a45] to-[#1791c7]",
  Latin: "from-[#2c1b1b] via-[#613332] to-[#d08a58]",
  Metal: "from-[#111114] via-[#24242a] to-[#73757e]",
  Other: "from-[#1d2026] via-[#333a45] to-[#1791c7]",
};

function PosterFallback({ blog }: { blog: Blog }) {
  const gradient = GENRE_GRADIENTS[blog.genre] || GENRE_GRADIENTS.Other;
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-between bg-gradient-to-br p-5 text-white",
        gradient
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
        {blog.genre}
      </span>
      <div>
        <p className="font-display text-[24px] uppercase leading-none">
          {blog.artistName || "Live Tour"}
        </p>
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
          {blog.tourName || "Tour Announcement"}
        </p>
      </div>
    </div>
  );
}

function remainingConcertsLabel(summary: ScheduleSummary | null | undefined) {
  const count = summary?.concertsRemaining ?? 0;
  return `${count} concert${count === 1 ? "" : "s"} remaining`;
}

function nextConcertLabel(summary: ScheduleSummary | null | undefined) {
  const next = summary?.nextConcert;
  if (!next) return "Dates to be announced";
  const place = next.city || next.venue;
  const date = formatDateShort(next.date);
  if (place && date) return `${place} on ${date}`;
  return place || date || "Dates to be announced";
}

export function PublicBlogCard({
  blog,
  priority = false,
  className,
}: {
  blog: Blog;
  priority?: boolean;
  className?: string;
}) {
  const date = blog.publishedAt || blog.createdAt;
  const href = publicSiteUrl(`/tours/${blog.slug}`);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-[#e5e5e5] bg-white transition duration-300 hover:border-[#1791c7] hover:shadow-[0_10px_28px_rgba(0,0,0,0.09)]",
        className
      )}
    >
      <a
        href={href}
        className="relative block aspect-[16/10] overflow-hidden bg-[#222222]"
        aria-label={`Read ${blog.title}`}
      >
        {blog.featuredImage ? (
          <img
            src={assetUrl(blog.featuredImage)}
            alt={blog.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <PosterFallback blog={blog} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-[2px] bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#535353] backdrop-blur">
            {blog.genre}
          </span>
          {blog.featured ? (
            <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#1791c7] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
              <Star className="h-2.5 w-2.5 fill-current" /> Featured
            </span>
          ) : null}
        </div>
      </a>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#127794]">
          {blog.artistName || "Artist"}
        </p>
        <h3 className="mt-1.5 font-display text-[22px] uppercase leading-none text-[#535353]">
          <a href={href} className="transition hover:text-[#127794]">
            {blog.title}
          </a>
        </h3>
        {blog.excerpt ? (
          <p className="mt-2 line-clamp-2 text-[11px] leading-[1.55] text-[#777777]">
            {blog.excerpt}
          </p>
        ) : null}

        <div className="mt-3 space-y-1 border-l-2 border-[#1791c7] pl-2.5">
          <p className="text-[10px] leading-tight text-[#777777]">
            <b className="font-bold text-[#535353]">Tour Dates:</b>{" "}
            {remainingConcertsLabel(blog.scheduleSummary)}
          </p>
          <p className="truncate text-[10px] leading-tight text-[#777777]">
            <b className="font-bold text-[#535353]">Next Concert:</b>{" "}
            {nextConcertLabel(blog.scheduleSummary)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eeeeee] pt-3 text-[10px] text-[#999999]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" />
            {formatDate(date)}
          </span>
          <a
            href={href}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#535353] transition group-hover:text-[#127794]"
          >
            View tour <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
