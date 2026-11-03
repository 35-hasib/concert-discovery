import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { api, assetUrl } from "../lib/api";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_TAGLINE,
} from "../lib/constants";
import type { SiteSettings } from "../lib/types";

const FALLBACK: SiteSettings = {
  websiteName: DEFAULT_SITE_NAME,
  tagline: DEFAULT_TAGLINE,
  logo: "",
  favicon: "",
  description: DEFAULT_DESCRIPTION,
  contactEmail: "",
  socialLinks: {},
  defaultSeoTitle: `${DEFAULT_SITE_NAME} - ${DEFAULT_TAGLINE}`,
  defaultSeoDescription: DEFAULT_DESCRIPTION,
};

type SettingsContextValue = {
  settings: SiteSettings;
  loading: boolean;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: FALLBACK,
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api<{ settings: SiteSettings }>("/settings")
      .then((data) => {
        if (active) setSettings({ ...FALLBACK, ...data.settings });
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!settings.favicon) return;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = assetUrl(settings.favicon);
  }, [settings.favicon]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SettingsContext);
}
