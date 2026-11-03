import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { GENRES } from "../lib/constants";

export function GenreGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {GENRES.map((genre, index) => (
        <Link
          key={genre}
          to={`/tours?genre=${encodeURIComponent(genre)}`}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 transition duration-200 hover:border-ember-500/50 hover:bg-ember-500"
        >
          <span className="flex items-center gap-3">
            <span className="text-[10px] font-bold tabular-nums text-white/30 transition group-hover:text-white/60">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-semibold text-white/85 transition group-hover:text-white">
              {genre}
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:text-white" />
        </Link>
      ))}
    </div>
  );
}
