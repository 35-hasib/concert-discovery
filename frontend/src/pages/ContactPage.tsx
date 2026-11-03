import { ChevronRight, Mail, MapPin, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import { useSiteSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";

export function ContactPage() {
  const { settings } = useSiteSettings();
  useSeo({
    title: `Contact | ${settings.websiteName}`,
    description: `Contact ${settings.websiteName}.`,
    path: "/contact",
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
        <span className="text-[#555555]">Contact</span>
      </nav>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ember-600">
          Get in touch
        </p>
        <h1 className="mt-1.5 font-display text-[38px] uppercase leading-none text-[#535353]">
          Contact Us
        </h1>
        <p className="mt-2 max-w-xl text-[12px] leading-[1.6] text-[#535353]">
          Tour question, correction or partnership enquiry? We would love to hear from you.
        </p>
        <div className="rule-accent mt-4" />
      </div>

      <div className="mt-6 grid max-w-4xl gap-5 sm:grid-cols-2">
        <div className="border border-[#e5e5e5] bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-ember-50 text-ember-600">
            <Mail className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-2xl uppercase leading-none text-[#535353]">
            Email
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#777777]">
            The fastest way to reach the {settings.websiteName} team.
          </p>
          {settings.contactEmail ? (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="mt-3 inline-block text-xs font-bold text-ember-600 underline underline-offset-2 hover:text-ember-700"
            >
              {settings.contactEmail}
            </a>
          ) : (
            <p className="mt-3 text-xs text-[#777777]">Contact details coming soon.</p>
          )}
        </div>

        <div className="border border-[#e5e5e5] bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-ember-50 text-ember-600">
            <MessageSquare className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-2xl uppercase leading-none text-[#535353]">
            Editorial
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#777777]">
            Send press releases, tour announcements and artist news for review by our editorial
            team.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-[#777777]">
            <MapPin className="h-3.5 w-3.5 text-ember-500" /> Worldwide, online
          </p>
        </div>
      </div>
    </div>
  );
}
