import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useSiteSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";

export function PrivacyPage() {
  const { settings } = useSiteSettings();
  useSeo({
    title: `Privacy Policy | ${settings.websiteName}`,
    description: `Privacy Policy for ${settings.websiteName}.`,
    path: "/privacy",
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
        <span className="text-[#555555]">Privacy Policy</span>
      </nav>

      <div className="mt-5">
        <h1 className="font-display text-[38px] uppercase leading-none text-[#535353]">
          Privacy Policy
        </h1>
        <div className="rule-accent mt-4" />
      </div>

      <article className="prose-article mt-6 max-w-3xl">
        <p>
          {settings.websiteName} respects your privacy. This page explains how we handle
          information when you browse tour announcements and use our website.
        </p>
        <h2>Information we collect</h2>
        <p>
          We only collect information you voluntarily provide, such as messages sent to our
          contact email. We do not require account creation to read tour announcements.
        </p>
        <h2>Third-party services</h2>
        <p>
          Concert schedule widgets are embedded through sandboxed iframes. Those third-party
          providers may collect information according to their own privacy policies when you
          interact with their ticketing features.
        </p>
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. Continued use of the site means you accept
          any updates.
        </p>
      </article>
    </div>
  );
}
