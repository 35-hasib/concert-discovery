import { CalendarDays, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

import { assetUrl } from "../lib/api";
import type { Blog } from "../lib/types";
import { cn, nextConcertLabel, remainingConcertsLabel } from "../lib/utils";

const FALLBACKS: Record<string, string> = {
  Rock: "from-[#3b0d0a] via-[#7a1c0c] to-[#1791c7]",
  Pop: "from-[#2d0b2a] via-[#8c1a63] to-[#1791c7]",
  Country: "from-[#2b1a05] via-[#7a4a0d] to-[#1791c7]",
  "Hip-Hop / Rap": "from-[#0a0a0f] via-[#26263a] to-[#1791c7]",
  "R&B": "from-[#1b0a17] via-[#5b1d43] to-[#1791c7]",
  Electronic: "from-[#04121a] via-[#073d4a] to-[#1791c7]",
  "Jazz / Blues": "from-[#0b1220] via-[#1e3a5f] to-[#1791c7]",
  Classical: "from-[#12100c] via-[#3d3222] to-[#1791c7]",
  Alternative: "from-[#101014] via-[#2a2a35] to-[#1791c7]",
  Latin: "from-[#2a0808] via-[#8a1a12] to-[#1791c7]",
  Metal: "from-[#08080a] via-[#1f1f24] to-[#1791c7]",
  Other: "from-[#0c0c10] via-[#24242e] to-[#1791c7]",
};

export function PerformerCard({
  blog,
  priority = false,
  className,
}: {
  blog: Blog;
  priority?: boolean;
  className?: string;
}) {
  const gradient = FALLBACKS[blog.genre] || FALLBACKS.Other;
  const remaining = remainingConcertsLabel(blog.scheduleSummary);
  const nextConcert = nextConcertLabel(blog.scheduleSummary);

  return (
    <article
      className={cn(
        "group relative aspect-[5/6] overflow-hidden rounded-[3px] bg-[#222222] shadow-[0_0_0_1px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {blog.featuredImage ? (
        <img
          src={assetUrl(blog.featuredImage)}
          alt={blog.artistName || blog.title}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-between bg-gradient-to-br p-5 text-white",
            gradient
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            {blog.genre}
          </span>
          <span className="font-display text-3xl uppercase leading-none">
            {blog.artistName || "Live Tour"}
          </span>
        </div>
      )}

      <Link
        to={`/tours/${blog.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`View ${blog.artistName || blog.title} tour dates`}
      />

      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-[49px] z-30 bg-black/70 px-3 pb-2.5 pt-2">
        <h3 className="truncate font-display text-[21px] uppercase leading-none text-white">
          <Link to={`/tours/${blog.slug}`} className="pointer-events-auto hover:text-ember-200">
            {blog.artistName || blog.title}
          </Link>
        </h3>
        <p className="mt-1.5 truncate text-[11px] leading-tight text-white/85">
          <b className="font-bold text-white">Tour Dates:</b> {remaining}
        </p>
        <p className="mt-0.5 truncate text-[11px] leading-tight text-white/85">
          <b className="font-bold text-white">Next Concert:</b> {nextConcert}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-40 grid grid-cols-2 divide-x divide-black/40 border-t border-white/10">
        <Link
          to={`/tours/${blog.slug}`}
          className="flex h-[49px] items-center justify-center gap-2 bg-[#333333] text-[11px] font-bold text-white transition hover:bg-ember-600"
        >
          <CalendarDays className="h-3.5 w-3.5" /> Tour Dates
        </Link>
        <Link
          to={`/tours/${blog.slug}#concert-schedule`}
          className="flex h-[49px] items-center justify-center gap-2 bg-[#333333] text-[11px] font-bold text-white transition hover:bg-ember-600"
        >
          <Ticket className="h-3.5 w-3.5" /> Buy Tickets
        </Link>
      </div>
    </article>
  );
}
