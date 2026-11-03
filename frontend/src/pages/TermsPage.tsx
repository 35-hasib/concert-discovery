import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useSiteSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";

export function TermsPage() {
  const { settings } = useSiteSettings();
  useSeo({
    title: `Terms of Service | ${settings.websiteName}`,
    description: `Terms of Service for ${settings.websiteName}.`,
    path: "/terms",
  });

  return (
    <div className="container-page bg-white px-5 pb-12 pt-5">
      <nav
        className="flex flex-wrap items-center gap-1.5 rounded-[2px] bg-[#f5f5f5] px-[15px] py-2 text-[11px] text-[#888888]"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="transition hover:text-ember-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-[#bbbbbb]" />
        <span className="text-[#555555]">Terms of Service</span>
      </nav>

      <div className="mt-5">
        <h1 className="font-display text-[38px] uppercase leading-none text-[#535353]">
          Terms of Service
        </h1>
        <div className="rule-accent mt-4" />
      </div>

      <article className="prose-article mt-6 max-w-3xl">
        <p>
          By using {settings.websiteName}, you agree to these terms. The site publishes concert
          tour announcements for informational purposes.
        </p>
        <h2>Tour information</h2>
        <p>
          Tour dates, venues, prices and availability are supplied by artists, promoters or
          ticketing partners and may change without notice. Always confirm details with the
          official ticket provider before purchasing.
        </p>
        <h2>Third-party links</h2>
        <p>
          Ticket links open third-party ticketing sites. We are not responsible for their content,
          inventory or purchasing terms.
        </p>
        <h2>Intellectual property</h2>
        <p>
          Content on this site is provided for personal, non-commercial use. Artists, images and
          trademarks belong to their respective owners.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          {settings.contactEmail ? (
            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          ) : (
            "our contact email"
          )}
          .
        </p>
      </article>
    </div>
  );
}
