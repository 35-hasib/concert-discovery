import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Code2,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  Save,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, errorMessage } from "../../lib/api";
import { GENRES } from "../../lib/constants";
import type { Blog, BlogStatus, TourAlbum } from "../../lib/types";
import { cn } from "../../lib/utils";
import { blogSchema } from "../../lib/validation";
import { Spinner } from "../Spinner";
import { WidgetFrame } from "../WidgetFrame";
import { ImagePicker, MultiImagePicker, uploadImageFile } from "./ImagePicker";
import { RichEditor } from "./RichEditor";
import { TourDetailsEditor } from "./TourDetailsEditor";

export type BlogFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  artistName: string;
  tourName: string;
  genre: string;
  tourStartDate: string;
  tourEndDate: string;
  featuredImage: string;
  additionalImages: string[];
  supportingArtists: string[];
  previousTour: string;
  albums: TourAlbum[];
  tourCities: string[];
  content: string;
  widgetEnabled: boolean;
  widgetCode: string;
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  status: BlogStatus;
  featured: boolean;
  publishedAt: string;
};

type Props = {
  mode: "create" | "edit";
  blogId?: string;
  initial: BlogFormValues;
  updatedAtLabel?: string;
  createdAtLabel?: string;
};

type Action = "draft" | "publish" | "current" | "preview";

function slugifyClient(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’"]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90);
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? <span className="ml-1 text-ember-600">*</span> : null}
      </label>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

export function BlogForm({ mode, blogId, initial, updatedAtLabel, createdAtLabel }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<BlogFormValues>(initial);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState<Action | null>(null);
  const [widgetPreviewOpen, setWidgetPreviewOpen] = useState(false);
  const [widgetPreviewHtml, setWidgetPreviewHtml] = useState("");
  const [widgetPreviewLoading, setWidgetPreviewLoading] = useState(false);
  const [widgetPreviewError, setWidgetPreviewError] = useState("");

  const isPublished = form.status === "PUBLISHED";
  const excerptCount = form.excerpt.length;
  const metaTitleCount = form.metaTitle.length;
  const metaDescriptionCount = form.metaDescription.length;

  const validationMessages = useMemo(() => Object.entries(errors), [errors]);

  function set<K extends keyof BlogFormValues>(key: K, value: BlogFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSavedMessage("");
  }

  function onTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugTouched ? current.slug : slugifyClient(value),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.title;
      if (!slugTouched) delete next.slug;
      return next;
    });
  }

  function buildPayload(action: Action) {
    const status: BlogStatus =
      action === "draft" ? "DRAFT" : action === "publish" ? "PUBLISHED" : form.status;

    return {
      ...form,
      status,
      publishedAt: form.publishedAt || null,
      tourStartDate: form.tourStartDate || null,
      tourEndDate: form.tourEndDate || null,
      additionalImages: form.additionalImages,
    };
  }

  async function submit(action: Action) {
    setFormError("");
    setSavedMessage("");

    if (action === "draft" && isPublished) {
      const confirmed = window.confirm(
        "Saving as a draft will unpublish this tour announcement. Continue?"
      );
      if (!confirmed) return;
    }

    const payload = buildPayload(action);
    const parsed = blogSchema.safeParse(payload);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setFormError("Please fix the highlighted fields before saving.");
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey) {
        const element = document.querySelector(`[data-field="${firstKey}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSaving(action);
    try {
      const data = await api<{ blog: Blog }>(
        mode === "edit" ? `/admin/blogs/${blogId}` : "/admin/blogs",
        {
          method: mode === "edit" ? "PUT" : "POST",
          body: payload,
        }
      );

      const nextId = data.blog.id || blogId;
      setForm((current) => ({
        ...current,
        slug: data.blog.slug || current.slug,
        status: payload.status,
      }));
      setSavedMessage(
        action === "draft"
          ? "Saved as draft."
          : action === "preview"
            ? "Saved. Opening preview…"
            : "Saved successfully."
      );
      window.setTimeout(() => setSavedMessage(""), 4000);

      if (mode === "create" && nextId) {
        navigate(`/blogs/${nextId}/edit`, { replace: true });
      }

      if (action === "preview" && nextId) {
        window.open(`/preview/${nextId}`, "_blank", "noopener,noreferrer");
      }
    } catch (saveError) {
      setFormError(errorMessage(saveError));
    } finally {
      setSaving(null);
    }
  }

  async function previewWidget() {
    setWidgetPreviewError("");
    if (!form.widgetCode.trim()) {
      setWidgetPreviewError("Paste the TicketNetwork embed code first.");
      return;
    }
    setWidgetPreviewLoading(true);
    setWidgetPreviewOpen(true);
    try {
      const data = await api<{ html: string }>("/admin/widget-preview", {
        method: "POST",
        body: { code: form.widgetCode, title: form.title || "Widget preview" },
      });
      setWidgetPreviewHtml(data.html);
    } catch (previewError) {
      setWidgetPreviewError(errorMessage(previewError));
    } finally {
      setWidgetPreviewLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit("publish");
      }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 transition hover:text-ink-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to blogs
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-tight text-ink-950">
              {mode === "edit" ? "Edit tour announcement" : "Create tour announcement"}
            </h2>
            <span className={isPublished ? "badge-status-published" : "badge-status-draft"}>
              {isPublished ? "Published" : "Draft"}
            </span>
            {form.featured ? <span className="badge-featured">Featured</span> : null}
          </div>
          {mode === "edit" ? (
            <p className="mt-1.5 text-xs text-ink-600">
              Created {createdAtLabel} · Last updated {updatedAtLabel}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-ink-600">
              Drafts are private. Publish when the article and schedule are ready.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void submit("preview")}
            disabled={Boolean(saving)}
            className="btn-outline btn-sm"
          >
            {saving === "preview" ? <Spinner className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            Preview
          </button>
          <button
            type="button"
            onClick={() => void submit("draft")}
            disabled={Boolean(saving)}
            className="btn-outline btn-sm"
          >
            {saving === "draft" ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save as draft
          </button>
          <button type="submit" disabled={Boolean(saving)} className="btn-primary btn-sm">
            {saving === "publish" ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isPublished ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {formError ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      {validationMessages.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Check these fields:</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs">
            {validationMessages.map(([key, message]) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .querySelector(`[data-field="${key}"]`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="underline underline-offset-2"
                >
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {savedMessage ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <Check className="h-4 w-4" /> {savedMessage}
          {form.slug && mode === "edit" ? (
            <Link
              to={`/preview/${blogId}`}
              target="_blank"
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
            >
              Open preview <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="admin-card" data-field="title">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ember-600" />
              <h3 className="font-display text-xl font-bold uppercase text-ink-950">
                Basic information
              </h3>
            </div>

            <div className="mt-5 space-y-5">
              <Field label="Blog title" htmlFor="title" required error={errors.title}>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className="input"
                  placeholder="e.g. Coldplay World Tour 2027: Dates, Cities & Tickets"
                  maxLength={200}
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="slug"
                required
                error={errors.slug}
                hint="SEO-friendly URL. Leave blank to generate it automatically."
              >
                <div className="flex items-center gap-2">
                  <span className="hidden shrink-0 rounded-l-xl border border-r-0 border-ink-950/15 bg-sand-100 px-3 py-3 text-sm text-ink-600 sm:block">
                    /tours/
                  </span>
                  <input
                    id="slug"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      set("slug", slugifyClient(event.target.value));
                    }}
                    className="input"
                    placeholder="coldplay-world-tour-2027"
                    maxLength={140}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSlugTouched(false);
                      set("slug", slugifyClient(form.title));
                    }}
                    className="btn-outline shrink-0 px-3 text-xs"
                  >
                    Generate
                  </button>
                </div>
              </Field>

              <Field
                label="Short description / excerpt"
                htmlFor="excerpt"
                error={errors.excerpt}
                hint={`${excerptCount}/600 characters · shown on cards and search results`}
              >
                <textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(event) => set("excerpt", event.target.value)}
                  className="textarea"
                  maxLength={600}
                  placeholder="A short, compelling summary of this tour announcement."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Artist name" htmlFor="artistName" required error={errors.artistName}>
                  <input
                    id="artistName"
                    value={form.artistName}
                    onChange={(event) => set("artistName", event.target.value)}
                    className="input"
                    placeholder="e.g. Coldplay"
                  />
                </Field>
                <Field label="Tour name" htmlFor="tourName" error={errors.tourName}>
                  <input
                    id="tourName"
                    value={form.tourName}
                    onChange={(event) => set("tourName", event.target.value)}
                    className="input"
                    placeholder="e.g. Music of the Spheres World Tour"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div data-field="genre">
                  <Field label="Music genre" htmlFor="genre" required error={errors.genre}>
                    <div className="relative">
                      <select
                        id="genre"
                        value={form.genre}
                        onChange={(event) => set("genre", event.target.value)}
                        className="select"
                      >
                        {GENRES.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink-600" />
                    </div>
                  </Field>
                </div>
                <div data-field="tourStartDate">
                  <Field label="Tour start date" htmlFor="tourStartDate" error={errors.tourStartDate}>
                    <input
                      id="tourStartDate"
                      type="date"
                      value={form.tourStartDate}
                      onChange={(event) => set("tourStartDate", event.target.value)}
                      className="input"
                    />
                  </Field>
                </div>
                <div data-field="tourEndDate">
                  <Field label="Tour end date" htmlFor="tourEndDate" error={errors.tourEndDate}>
                    <input
                      id="tourEndDate"
                      type="date"
                      value={form.tourEndDate}
                      onChange={(event) => set("tourEndDate", event.target.value)}
                      className="input"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </section>

          <TourDetailsEditor
            supportingArtists={form.supportingArtists}
            previousTour={form.previousTour}
            albums={form.albums}
            tourCities={form.tourCities}
            onSupportingArtistsChange={(value) => set("supportingArtists", value)}
            onPreviousTourChange={(value) => set("previousTour", value)}
            onAlbumsChange={(value) => set("albums", value)}
            onTourCitiesChange={(value) => set("tourCities", value)}
          />

          <section className="admin-card" data-field="featuredImage">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-ember-600" />
              <h3 className="font-display text-xl font-bold uppercase text-ink-950">Media</h3>
            </div>
            <div className="mt-5 space-y-6">
              <ImagePicker
                label="Featured image"
                value={form.featuredImage}
                onChange={(url) => set("featuredImage", url)}
                hint="Used on cards, the tour page and social sharing. Recommended 1600×1000."
              />
              <div>
                <span className="field-label">Additional article images</span>
                <MultiImagePicker
                  values={form.additionalImages}
                  onChange={(urls) => set("additionalImages", urls)}
                />
              </div>
            </div>
          </section>

          <section className="admin-card" data-field="content">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-ember-600" />
                <h3 className="font-display text-xl font-bold uppercase text-ink-950">
                  Blog content
                </h3>
              </div>
              <span className="text-[11px] text-ink-600">Rich text editor</span>
            </div>
            <div className="mt-5">
              <RichEditor
                value={form.content}
                onChange={(html) => set("content", html)}
                onUploadImage={(file) => uploadImageFile(file)}
                placeholder="Write the full tour announcement. Add headings, tour highlights, venue details and ticket information..."
              />
              {errors.content ? <p className="field-error">{errors.content}</p> : null}
            </div>
          </section>

          <section
            className="rounded-2xl border-2 border-ember-500/30 bg-white p-5 shadow-sm sm:p-6"
            data-field="widgetCode"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-50 text-ember-600">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase text-ink-950">
                    Concert Schedule Integration
                  </h3>
                  <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-600">
                    Paste the complete TicketNetwork embed code. The saved widget is rendered
                    in a secure sandbox on this tour&apos;s public page.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <span className="text-xs font-semibold text-ink-700">Enable schedule</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.widgetEnabled}
                  onClick={() => set("widgetEnabled", !form.widgetEnabled)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition",
                    form.widgetEnabled ? "bg-ember-500" : "bg-ink-950/20"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                      form.widgetEnabled ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="widgetCode" className="text-xs font-semibold text-ink-800">
                  TicketNetwork embed code
                </label>
                <span className="text-[11px] tabular-nums text-ink-600">
                  {form.widgetCode.length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                id="widgetCode"
                value={form.widgetCode}
                onChange={(event) => set("widgetCode", event.target.value)}
                className="min-h-[280px] w-full resize-y rounded-xl border border-ink-950/15 bg-ink-950 p-4 font-mono text-xs leading-relaxed text-emerald-200/90 outline-none transition placeholder:text-white/25 focus:border-ember-500 focus:ring-4 focus:ring-ember-500/10"
                placeholder={'<!-- Paste the complete TicketNetwork embed code here -->\n<div id="tn-widget">...</div>\n<script src="..."></script>'}
                spellCheck={false}
              />
              <p className="field-hint">
                HTML, CSS, JavaScript and external script tags are all preserved. The code is
                isolated in a sandboxed iframe and never executes on the main site.
              </p>
              {errors.widgetCode ? <p className="field-error">{errors.widgetCode}</p> : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void previewWidget()}
                  disabled={widgetPreviewLoading || !form.widgetCode.trim()}
                  className="btn-dark btn-sm"
                >
                  {widgetPreviewLoading ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Preview Widget
                </button>
                <button
                  type="button"
                  onClick={() => void submit("current")}
                  disabled={Boolean(saving) || !form.widgetCode.trim()}
                  className="btn-outline btn-sm"
                >
                  {saving === "current" ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Widget Code
                </button>
                {form.widgetCode ? (
                  <button
                    type="button"
                    onClick={() => {
                      set("widgetCode", "");
                      setWidgetPreviewOpen(false);
                      setWidgetPreviewHtml("");
                    }}
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  >
                    Clear code
                  </button>
                ) : null}
              </div>

              {widgetPreviewError ? <p className="field-error">{widgetPreviewError}</p> : null}

              {widgetPreviewOpen ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-600">
                      Widget preview · sandboxed
                    </p>
                    <button
                      type="button"
                      onClick={() => setWidgetPreviewOpen(false)}
                      className="text-xs font-semibold text-ink-600 hover:text-ink-950"
                    >
                      Close preview
                    </button>
                  </div>
                  {widgetPreviewHtml ? (
                    <WidgetFrame
                      srcDoc={widgetPreviewHtml}
                      title="Concert schedule widget preview"
                    />
                  ) : (
                    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-ink-950/15 bg-sand-50">
                      {widgetPreviewLoading ? (
                        <Spinner className="h-6 w-6 text-ember-500" />
                      ) : (
                        <p className="text-sm text-ink-600">No preview loaded.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ember-600" />
              <h3 className="font-display text-xl font-bold uppercase text-ink-950">
                SEO settings
              </h3>
            </div>
            <div className="mt-5 space-y-5">
              <Field
                label="Meta title"
                htmlFor="metaTitle"
                error={errors.metaTitle}
                hint={`${metaTitleCount}/200 · recommended under 60 characters`}
              >
                <input
                  id="metaTitle"
                  value={form.metaTitle}
                  onChange={(event) => set("metaTitle", event.target.value)}
                  className="input"
                  placeholder={form.title || "Tour announcement title"}
                  maxLength={200}
                />
              </Field>
              <Field
                label="Meta description"
                htmlFor="metaDescription"
                error={errors.metaDescription}
                hint={`${metaDescriptionCount}/400 · recommended under 160 characters`}
              >
                <textarea
                  id="metaDescription"
                  value={form.metaDescription}
                  onChange={(event) => set("metaDescription", event.target.value)}
                  className="textarea min-h-[90px]"
                  placeholder={form.excerpt || "Search result description"}
                  maxLength={400}
                />
              </Field>
              <Field
                label="SEO keywords"
                htmlFor="seoKeywords"
                error={errors.seoKeywords}
                hint="Comma-separated, e.g. coldplay tour, concert tickets, 2027 tour dates"
              >
                <input
                  id="seoKeywords"
                  value={form.seoKeywords}
                  onChange={(event) => set("seoKeywords", event.target.value)}
                  className="input"
                  placeholder="artist name, tour name, concert tickets"
                  maxLength={600}
                />
              </Field>
              <p className="rounded-lg bg-sand-50 px-3 py-2 text-xs text-ink-600">
                The Open Graph image defaults to the featured image. If no featured image is
                set, the site-wide share image is used.
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="xl:sticky xl:top-24 xl:space-y-6">
            <section className="admin-card">
              <h3 className="font-display text-lg font-bold uppercase text-ink-950">
                Publishing settings
              </h3>
              <div className="mt-4 space-y-4">
                <Field label="Status" htmlFor="status">
                  <select
                    id="status"
                    value={form.status}
                    onChange={(event) => set("status", event.target.value as BlogStatus)}
                    className="select"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </Field>

                <div>
                  <span className="field-label">Publication date</span>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(event) => set("publishedAt", event.target.value)}
                    className="input"
                  />
                  <p className="field-hint">
                    Leave empty to use the current time. Future dates schedule the post.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-950/10 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-ink-800">
                      Featured post
                    </span>
                    <span className="block text-[11px] text-ink-600">
                      Highlight on the homepage
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.featured}
                    onClick={() => set("featured", !form.featured)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition",
                      form.featured ? "bg-ember-500" : "bg-ink-950/20"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                        form.featured ? "left-[22px]" : "left-0.5"
                      )}
                    />
                  </button>
                </label>
              </div>
            </section>

            <section className="admin-card">
              <h3 className="font-display text-lg font-bold uppercase text-ink-950">
                Publish checklist
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-ink-600">
                {[
                  {
                    label: "Title and artist added",
                    done: Boolean(form.title.trim() && form.artistName.trim()),
                  },
                  { label: "Featured image uploaded", done: Boolean(form.featuredImage) },
                  { label: "Article content written", done: Boolean(form.content.trim()) },
                  {
                    label: "Concert schedule configured",
                    done: form.widgetEnabled && Boolean(form.widgetCode.trim()),
                  },
                  {
                    label: "SEO details reviewed",
                    done: Boolean(form.metaTitle || form.metaDescription),
                  },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full",
                        item.done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-ink-950/5 text-ink-600/40"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-ink-950/[0.07] bg-ink-950 p-5 text-white">
              <p className="font-display text-lg font-bold uppercase leading-none">
                Need a hand?
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                Widgets render only when enabled and code is present. Each blog keeps its own
                independent embed code.
              </p>
              <Link
                to="/blogs"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ember-400 hover:text-ember-300"
              >
                Manage all blogs <ExternalLink className="h-3 w-3" />
              </Link>
            </section>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-950/[0.07] pt-5">
        <button
          type="button"
          onClick={() => void submit("preview")}
          disabled={Boolean(saving)}
          className="btn-outline btn-sm"
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
        <button
          type="button"
          onClick={() => void submit("draft")}
          disabled={Boolean(saving)}
          className="btn-outline btn-sm"
        >
          <Save className="h-4 w-4" /> Save as draft
        </button>
        <button type="submit" disabled={Boolean(saving)} className="btn-primary btn-sm">
          {saving === "publish" ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {isPublished ? "Update" : "Publish"}
        </button>
      </div>
    </form>
  );
}
