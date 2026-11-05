import { AlertCircle, Globe2, Save, Share2, Sparkles } from "lucide-react";
import { useState } from "react";

import { ApiError, api, assetUrl, errorMessage, siteUrl } from "../../lib/api";
import { SOCIAL_PLATFORMS } from "../../lib/constants";
import { showAdminToast } from "../../lib/toast";
import type { SiteSettings } from "../../lib/types";
import { settingsSchema } from "../../lib/validation";
import { Spinner } from "../Spinner";
import { ImagePicker } from "./ImagePicker";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState<SiteSettings>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function setSocial(key: string, value: string) {
    setForm((current) => ({
      ...current,
      socialLinks: { ...current.socialLinks, [key]: value },
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`socialLinks.${key}`];
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = settingsSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const data = await api<{ settings: SiteSettings }>("/admin/settings", {
        method: "PUT",
        body: parsed.data,
      });
      setForm(data.settings);
      setErrors({});
      showAdminToast({ message: "Settings saved successfully." });
      window.dispatchEvent(new Event("cd-admin:settings-updated"));
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.fieldErrors) {
        setErrors(saveError.fieldErrors);
      }
      setFormError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember-600">
            Site configuration
          </p>
          <h2 className="mt-1 font-display text-[32px] font-normal uppercase leading-none text-[#535353]">
            Website settings
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            These values are saved to the database and reflected across the public site.
          </p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
      </div>

      {formError ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="admin-card">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-ember-600" />
              <h3 className="font-display text-xl font-normal uppercase text-[#535353]">General</h3>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="websiteName" className="field-label">
                  Website name <span className="text-ember-600">*</span>
                </label>
                <input
                  id="websiteName"
                  value={form.websiteName}
                  onChange={(event) => set("websiteName", event.target.value)}
                  className="input"
                  maxLength={120}
                />
                {errors.websiteName ? <p className="field-error">{errors.websiteName}</p> : null}
              </div>
              <div>
                <label htmlFor="tagline" className="field-label">
                  Tagline
                </label>
                <input
                  id="tagline"
                  value={form.tagline}
                  onChange={(event) => set("tagline", event.target.value)}
                  className="input"
                  maxLength={220}
                  placeholder="Discover Tours. Explore Artists. Find Tickets."
                />
                {errors.tagline ? <p className="field-error">{errors.tagline}</p> : null}
              </div>
              <div>
                <label htmlFor="description" className="field-label">
                  Website description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                  className="textarea"
                  maxLength={1500}
                  placeholder="A short description shown in the footer and search results."
                />
                {errors.description ? <p className="field-error">{errors.description}</p> : null}
              </div>
              <div>
                <label htmlFor="contactEmail" className="field-label">
                  Contact email
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => set("contactEmail", event.target.value)}
                  className="input"
                  placeholder="hello@example.com"
                  maxLength={200}
                />
                {errors.contactEmail ? <p className="field-error">{errors.contactEmail}</p> : null}
              </div>
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-ember-600" />
              <h3 className="font-display text-xl font-normal uppercase text-[#535353]">
                Social media
              </h3>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {SOCIAL_PLATFORMS.map((platform) => {
                const value =
                  form.socialLinks[platform.key as keyof typeof form.socialLinks] || "";
                const error = errors[`socialLinks.${platform.key}`];
                return (
                  <div key={platform.key}>
                    <label htmlFor={`social-${platform.key}`} className="field-label">
                      {platform.label}
                    </label>
                    <input
                      id={`social-${platform.key}`}
                      value={value}
                      onChange={(event) => setSocial(platform.key, event.target.value)}
                      className="input"
                      placeholder={platform.placeholder}
                    />
                    {error ? <p className="field-error">{error}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ember-600" />
              <h3 className="font-display text-xl font-normal uppercase text-[#535353]">
                Default SEO
              </h3>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="defaultSeoTitle" className="field-label">
                  Default SEO title
                </label>
                <input
                  id="defaultSeoTitle"
                  value={form.defaultSeoTitle}
                  onChange={(event) => set("defaultSeoTitle", event.target.value)}
                  className="input"
                  maxLength={220}
                  placeholder={`${form.websiteName} - ${form.tagline}`}
                />
                <p className="field-hint">{form.defaultSeoTitle.length}/220</p>
                {errors.defaultSeoTitle ? (
                  <p className="field-error">{errors.defaultSeoTitle}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="defaultSeoDescription" className="field-label">
                  Default SEO description
                </label>
                <textarea
                  id="defaultSeoDescription"
                  value={form.defaultSeoDescription}
                  onChange={(event) => set("defaultSeoDescription", event.target.value)}
                  className="textarea min-h-[90px]"
                  maxLength={500}
                  placeholder="Default meta description for the homepage."
                />
                <p className="field-hint">{form.defaultSeoDescription.length}/500</p>
                {errors.defaultSeoDescription ? (
                  <p className="field-error">{errors.defaultSeoDescription}</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="xl:sticky xl:top-24 xl:space-y-6">
            <section className="admin-card">
              <h3 className="font-display text-lg font-normal uppercase text-[#535353]">
                Brand assets
              </h3>
              <div className="mt-4 space-y-5">
                <ImagePicker
                  label="Website logo"
                  value={form.logo}
                  onChange={(url) => set("logo", url)}
                  hint="Shown in the header and footer. PNG or WebP with transparent background works best."
                  aspect="aspect-[3/1]"
                />
                <ImagePicker
                  label="Favicon"
                  value={form.favicon}
                  onChange={(url) => set("favicon", url)}
                  kind="favicon"
                  hint="Square image, resized to 64×64 PNG."
                />
              </div>
            </section>

            <section className="rounded-[3px] border border-[#333333] bg-[#222222] p-5 text-white">
              <p className="font-display text-lg font-bold uppercase leading-none">
                Live brand preview
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                {form.logo ? (
                  <img
                    src={assetUrl(form.logo)}
                    alt="Logo preview"
                    className="h-9 w-auto max-w-[90px] object-contain"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-500 font-display text-sm font-bold">
                    {form.websiteName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold uppercase">
                    {form.websiteName || "Website name"}
                  </p>
                  <p className="truncate text-[10px] text-white/50">
                    {form.tagline || "Your tagline"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                Website name, tagline, logo and favicon update the public header, footer and
                browser metadata after saving.
              </p>
            </section>

            <section className="admin-card">
              <h3 className="font-display text-lg font-normal uppercase text-[#535353]">
                SEO preview
              </h3>
              <div className="mt-3 rounded-xl border border-ink-950/[0.08] bg-white p-3">
                <p className="truncate text-[11px] text-emerald-700">{siteUrl()}</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-medium text-[#1a0dab]">
                  {form.defaultSeoTitle || `${form.websiteName} - ${form.tagline}`}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-600">
                  {form.defaultSeoDescription || form.description || "Default SEO description"}
                </p>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <div className="flex justify-end border-t border-ink-950/[0.07] pt-5">
        <button type="submit" disabled={saving} className="btn-primary btn-sm">
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
      </div>
    </form>
  );
}
