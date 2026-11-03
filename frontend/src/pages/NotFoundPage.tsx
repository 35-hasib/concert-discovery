import { Search, Ticket } from "lucide-react";
import { Link } from "react-router-dom";

import { useSiteSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";

export function NotFoundPage() {
  const { settings } = useSiteSettings();
  useSeo({
    title: `404 | ${settings.websiteName}`,
    description: "This tour announcement does not exist, was unpublished, or moved to a new URL.",
    path: "/404",
    noindex: true,
  });

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center bg-white px-5 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ember-50 text-ember-600">
        <Ticket className="h-7 w-7" />
      </span>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-ember-600">404</p>
      <h1 className="mt-1 font-display text-5xl uppercase leading-none text-[#535353] sm:text-6xl">
        Stage not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#777777]">
        This tour announcement does not exist, was unpublished, or moved to a new URL.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Go home
        </Link>
        <Link to="/tours" className="btn-outline">
          <Search className="h-4 w-4" /> Browse tours
        </Link>
      </div>
    </div>
  );
}
