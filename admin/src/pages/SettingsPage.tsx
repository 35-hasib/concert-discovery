import { useEffect, useState } from "react";

import { SettingsForm } from "../components/admin/SettingsForm";
import { SpinnerBlock } from "../components/Spinner";
import { api, errorMessage } from "../lib/api";
import type { SiteSettings } from "../lib/types";

export function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api<{ settings: SiteSettings }>("/settings", { auth: false });
        if (!cancelled) setSettings(data.settings);
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-card">
        <SpinnerBlock label="Loading settings..." />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="admin-card px-6 py-16 text-center">
        <p className="text-sm text-red-600">{error || "Settings unavailable."}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-outline btn-sm mt-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return <SettingsForm initial={settings} />;
}
