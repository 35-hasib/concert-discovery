import { Outlet } from "react-router-dom";

import { useSiteSettings } from "../context/SettingsContext";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PublicLayout() {
  const { settings } = useSiteSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ember-500 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader settings={settings} />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
