import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { API_ORIGIN } from "../lib/api";
import type { SiteSettings } from "../lib/types";
import { LogoLight } from "./Logo";
import { SocialIcon, type SocialName } from "./SocialIcon";

const SOCIAL_ICONS: Record<string, SocialName> = {
  twitter: "twitter",
  facebook: "facebook",
  instagram: "instagram",
  youtube: "youtube",
  tiktok: "tiktok",
};

const FOOTER_GENRES = ["Rock", "Pop", "Country", "Hip-Hop / Rap"];

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const socials = Object.entries(settings.socialLinks || {}).filter(
    ([key, value]) => value && key in SOCIAL_ICONS
  );

  return (
    <footer className="bg-[#222222] text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr]">
        <div className="max-w-sm">
          <LogoLight name={settings.websiteName} src={settings.logo} />
          <p className="mt-4 text-xs leading-relaxed text-white/55">{settings.description}</p>
          {settings.contactEmail ? (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-white/70 transition hover:text-white"
            >
              <Mail className="h-3.5 w-3.5 text-ember-300" />
              {settings.contactEmail}
            </a>
          ) : null}
          {socials.length > 0 ? (
            <div className="mt-5 flex gap-2">
              {socials.map(([key, href]) => {
                const icon = SOCIAL_ICONS[key];
                if (!icon || !href) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${key}`}
                    className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-ember-400/50 hover:bg-ember-500/15 hover:text-ember-200"
                  >
                    <SocialIcon name={icon} className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="font-display text-lg uppercase tracking-wide text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <Link to="/" className="text-white/60 transition hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link to="/tours" className="text-white/60 transition hover:text-white">
                All Tours
              </Link>
            </li>
            <li>
              <Link to="/tours#genres" className="text-white/60 transition hover:text-white">
                Browse Genres
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-white/60 transition hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg uppercase tracking-wide text-white">Genres</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {FOOTER_GENRES.map((genre) => (
              <li key={genre}>
                <Link
                  to={`/tours?genre=${encodeURIComponent(genre)}`}
                  className="text-white/60 transition hover:text-white"
                >
                  {genre}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg uppercase tracking-wide text-white">Company</h2>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <Link to="/privacy" className="text-white/60 transition hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-white/60 transition hover:text-white">
                Terms of Service
              </Link>
            </li>
            <li>
              <a
                href={`${API_ORIGIN}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 transition hover:text-white"
              >
                Sitemap
              </a>
            </li>
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-white/35">
            Tour dates and ticket links are provided by official partners.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.websiteName}. All rights reserved.
          </p>
          <p>{settings.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
