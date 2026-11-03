import {
  Bell,
  CalendarDays,
  ChevronRight,
  Disc3,
  Headphones,
  MapPin,
  Music4,
  Search,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { PerformerCard } from "../components/PerformerCard";
import { useSiteSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";
import { api, assetUrl } from "../lib/api";
import { GENRES } from "../lib/constants";
import type { Blog } from "../lib/types";
import { formatDateShort } from "../lib/utils";

const FEATURES = [
  {
    title: "Get Tour Announcements",
    body: "See the latest tour announcements and concert schedules from today's biggest artists.",
    href: "/tours",
    icon: Ticket,
  },
  {
    title: "Track Your Favorite Artists",
    body: "Follow the artists you love and keep every upcoming live date in one place.",
    href: "/tours",
    icon: Bell,
  },
  {
    title: "Find Local Concerts",
    body: "Browse upcoming concerts by artist, venue, city and genre near you.",
    href: "/tours",
    icon: MapPin,
  },
  {
    title: "Great Deals on Tickets",
    body: "Compare official ticket links and find the best available seats for your next show.",
    href: "/tours",
    icon: Ticket,
  },
];

export function HomePage() {
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState<Blog[]>([]);
  const [latest, setLatest] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: settings.defaultSeoTitle || `${settings.websiteName} - ${settings.tagline}`,
    description: settings.defaultSeoDescription || settings.description,
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.websiteName,
      description: settings.description,
      url: window.location.origin,
    },
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ items: Blog[] }>("/blogs/featured?limit=6"),
      api<{ items: Blog[] }>("/blogs/latest?limit=12"),
    ])
      .then(([featuredData, latestData]) => {
        if (!active) return;
        setFeatured(featuredData.items);
        setLatest(latestData.items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const performers = useMemo(() => {
    const seen = new Set<string>();
    return [...featured, ...latest].filter((blog) => {
      if (seen.has(blog.id)) return false;
      seen.add(blog.id);
      return true;
    });
  }, [featured, latest]);

  const latestUpdates = performers.slice(0, 3);

  return (
    <>
      <section className="bg-[#2d2d2d] text-white">
        <div className="container-page pb-[70px] pt-[85px] text-center">
          <h1 className="font-display text-4xl uppercase leading-none tracking-wide text-white sm:text-[50px]">
            Never Miss a Concert Again
          </h1>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const value = query.trim();
              navigate(value ? `/tours?q=${encodeURIComponent(value)}` : "/tours");
            }}
            className="mx-auto mt-[25px] flex max-w-[850px]"
            role="search"
          >
            <label className="sr-only" htmlFor="home-search">
              Search artists, venues or cities
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search artists, venues, cities..."
              className="h-[49px] min-w-0 flex-1 rounded-l-[5px] border-2 border-r-0 border-[#bebebe] bg-white px-3 text-[17px] text-[#555555] outline-none placeholder:text-[#999999] focus:border-ember-500"
            />
            <button
              type="submit"
              aria-label="Search concerts"
              className="flex h-[49px] w-[74px] shrink-0 items-center justify-center rounded-r-[5px] bg-[#363636] text-white transition hover:bg-[#1f1f1f]"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-white/45">
            <span className="uppercase tracking-[0.14em]">Popular:</span>
            {["Rock", "Pop", "Country", "Hip-Hop / Rap"].map((genre) => (
              <Link
                key={genre}
                to={`/tours?genre=${encodeURIComponent(genre)}`}
                className="text-white/65 transition hover:text-white"
              >
                {genre}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page bg-white pb-10 pt-5">
        <section className="grid grid-cols-2 gap-x-[30px] gap-y-6 lg:grid-cols-4" aria-label="Ways to discover concerts">
          {FEATURES.map((feature, index) => {
            const image = performers[index]?.featuredImage;
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.href}
                className="group block border-b-2 border-transparent pb-3 text-center transition hover:border-ember-500"
              >
                <div className="relative aspect-[270/140] overflow-hidden bg-[#111111]">
                  {image ? (
                    <img
                      src={assetUrl(image)}
                      alt=""
                      aria-hidden="true"
                      loading={index < 2 ? "eager" : "lazy"}
                      className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1791c7_0%,#212121_55%,#111111_100%)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                  <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-[3px] bg-white/95 text-ember-600 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <h2 className="mt-2 font-display text-[18px] uppercase leading-tight text-[#535353] transition group-hover:text-ember-600">
                  {feature.title}
                </h2>
                <p className="mx-auto mt-1 max-w-[240px] text-[12px] leading-[1.5] text-[#535353]">
                  {feature.body}
                </p>
              </Link>
            );
          })}
        </section>

        <div className="rule-accent my-[34px]" />

        <div className="grid gap-[30px] lg:grid-cols-[minmax(0,1fr)_270px]">
          <section aria-labelledby="featured-performers">
            <h2
              id="featured-performers"
              className="font-display text-[32px] uppercase leading-none text-[#535353]"
            >
              Featured Performers
            </h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-[1.55] text-[#535353]">
              Check out the top concert performers on tour now. Browse all artists or search for a
              specific performer to see every announced date.
            </p>
            <div className="rule-accent my-4" />

            {loading ? (
              <div className="grid gap-[15px] sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="skeleton aspect-[5/6] rounded-[3px]" />
                ))}
              </div>
            ) : performers.length > 0 ? (
              <>
                <div className="grid gap-[15px] sm:grid-cols-2 xl:grid-cols-3">
                  {performers.slice(0, 12).map((blog, index) => (
                    <PerformerCard key={blog.id} blog={blog} priority={index < 3} />
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <Link to="/tours" className="btn-primary px-7">
                    View all performers <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-[3px] border border-dashed border-[#cccccc] bg-[#fafafa] px-6 py-14 text-center">
                <Ticket className="mx-auto h-9 w-9 text-ember-500" />
                <h3 className="mt-3 font-display text-2xl uppercase text-[#535353]">
                  No tour announcements yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs text-[#777777]">
                  New performer announcements will appear here as soon as they are published.
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-5" aria-label="Concert discovery sidebar">
            <div className="bg-ember-500 p-5 text-white">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                <Bell className="h-3.5 w-3.5" /> Concert Tracker
              </p>
              <h2 className="mt-1 font-display text-[28px] uppercase leading-none text-white">
                Never miss a show
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
                Follow the artists you care about and keep their upcoming tour dates close at hand.
              </p>
              <Link
                to="/tours"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-[3px] bg-white px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#333333] transition hover:bg-[#222222] hover:text-white"
              >
                Track artists <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="flex items-center gap-2 font-display text-xl uppercase leading-none text-[#535353]">
                  <Music4 className="h-4 w-4 text-ember-600" /> Browse by genre
                </h2>
              </div>
              <ul className="divide-y divide-[#eeeeee]">
                {GENRES.slice(0, 6).map((genre) => (
                  <li key={genre}>
                    <Link
                      to={`/tours?genre=${encodeURIComponent(genre)}`}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs text-[#535353] transition hover:bg-[#fafafa] hover:text-ember-600"
                    >
                      {genre}
                      <ChevronRight className="h-3.5 w-3.5 text-[#bbbbbb]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {latestUpdates.length > 0 ? (
              <div className="border border-[#e5e5e5] bg-white">
                <div className="border-b border-[#eeeeee] px-4 py-3">
                  <h2 className="flex items-center gap-2 font-display text-xl uppercase leading-none text-[#535353]">
                    <Sparkles className="h-4 w-4 text-ember-600" /> Latest updates
                  </h2>
                </div>
                <ul className="divide-y divide-[#eeeeee]">
                  {latestUpdates.map((blog) => (
                    <li key={blog.id}>
                      <Link to={`/tours/${blog.slug}`} className="group flex gap-3 p-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[2px] bg-[#222222]">
                          {blog.featuredImage ? (
                            <img
                              src={assetUrl(blog.featuredImage)}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-[#333333] text-white/70">
                              <Headphones className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-bold leading-snug text-[#535353] transition group-hover:text-ember-600">
                            {blog.artistName || blog.title}
                          </p>
                          <p className="mt-1 text-[10px] text-[#999999]">
                            {formatDateShort(blog.publishedAt || blog.createdAt)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="border border-[#e5e5e5] bg-white p-4">
              <h2 className="flex items-center gap-2 font-display text-xl uppercase leading-none text-[#535353]">
                <Disc3 className="h-4 w-4 text-ember-600" /> Tour planning
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-[#535353]">
                <li className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-600" />
                  Compare announced dates before booking.
                </li>
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-600" />
                  Check the venue before you travel.
                </li>
                <li className="flex gap-2">
                  <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-600" />
                  Use official ticket partner links.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
