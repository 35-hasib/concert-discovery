import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  Disc3,
  Eye,
  History,
  Music2,
  Music4,
  Save,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { api, assetUrl, errorMessage, publicSiteUrl } from "../../lib/api";
import { GENRES } from "../../lib/constants";
import type { Blog, BlogStatus, TourAlbum } from "../../lib/types";
import { showAdminToast } from "../../lib/toast";
import { blogSchema, formatZodErrors } from "../../lib/validation";
import { cn, formatDateRange, readingTime } from "../../lib/utils";
import { PublicShareButtons } from "../PublicShareButtons";
import { ImagePicker, MultiImagePicker, uploadImageFile } from "./ImagePicker";
import { RichEditor } from "./RichEditor";
import {
  AlbumsEditor,
  PreviousTourEditor,
  SupportingArtistsEditor,
  TourCitiesEditor,
} from "./TourDetailsEditor";

export type BlogFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  artistName: string;
  tourName: string;
  genre: string;
  tourYear: string;
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
  scheduleArtistQuery: string;
  scheduleEndDate: string;
  scheduleAffiliateUrl: string;
  schedulePerPage: number;
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  status: BlogStatus;
  featured: boolean;
  publishedAt: string;
};

type BlogFormProps = {
  mode: "create" | "edit";
  initial: BlogFormValues;
  blogId?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
};

type SaveMode = "draft" | "publish" | "save";

const PUBLIC_GENRES = [
  "Rock",
  "Pop",
  "Country",
  "Hip-Hop / Rap",
  "Electronic",
  "Latin",
];

const inlineInput =
  "w-full rounded-[2px] border border-transparent bg-transparent p-0 text-inherit outline-none transition placeholder:text-[#aaaaaa] hover:border-[#d7d7d7] focus:border-[#1791c7] focus:bg-white focus:px-1.5";

function tourYearFromValues(
  values: Pick<BlogFormValues, "tourYear" | "tourStartDate" | "publishedAt">
) {
  const explicit = Number(values.tourYear);
  if (Number.isInteger(explicit) && explicit >= 1900 && explicit <= 2100) {
    return explicit;
  }
  return values.tourStartDate
    ? new Date(values.tourStartDate).getUTCFullYear()
    : new Date(values.publishedAt || Date.now()).getUTCFullYear();
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  id,
  rows,
  maxLength,
  min,
  max,
  required,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  id?: string;
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const inputId =
    id ||
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children ? (
        children
      ) : rows ? (
        <textarea
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className="textarea"
        />
      ) : (
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          disabled={disabled}
          className="input"
        />
      )}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-medium text-red-600">{message}</p>;
}

function PublicSection({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("mt-9 scroll-mt-24", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] uppercase leading-none text-[#535353] sm:text-[32px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[12px] leading-relaxed text-[#777777]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="rule-accent mt-2" />
      {children}
    </section>
  );
}

function AlbumCover({ album }: { album: TourAlbum }) {
  return (
    <div className="relative aspect-square w-[110px] shrink-0 bg-[#222222]">
      {album.cover ? (
        <img
          src={assetUrl(album.cover)}
          alt={`${album.title} album cover`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-between bg-gradient-to-br from-[#1791c7] to-[#222222] p-3 text-white">
          <Disc3 className="h-5 w-5 text-white/70" />
          <p className="font-display text-base uppercase leading-none">
            {album.title || "Album"}
          </p>
        </div>
      )}
    </div>
  );
}

export function BlogForm({
  mode,
  initial,
  blogId,
  createdAtLabel,
  updatedAtLabel,
}: BlogFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<BlogFormValues>(initial);
  const [yearDraft, setYearDraft] = useState(() =>
    String(tourYearFromValues(initial))
  );
  const [saving, setSaving] = useState<SaveMode | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  function set<K extends keyof BlogFormValues>(key: K, value: BlogFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function maybeAutoSlug(value: string) {
    set("title", value);
    if (mode === "create") {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      set("slug", slug);
    }
  }

  function changeTourYear(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setYearDraft(digits);
    if (digits.length !== 4) return;
    const year = Number(digits);
    if (year >= 1900 && year <= 2100) set("tourYear", digits);
  }

  function commitTourYear() {
    const year = Number(yearDraft);
    if (yearDraft.length !== 4 || year < 1900 || year > 2100) {
      setYearDraft(String(tourYearFromValues(form)));
      return;
    }
    set("tourYear", yearDraft);
  }

  function validate(): BlogFormValues | null {
    const normalized: BlogFormValues = {
      ...form,
      widgetEnabled: Boolean(form.widgetCode.trim()),
      scheduleArtistQuery: "",
      scheduleEndDate: "",
      scheduleAffiliateUrl: "",
    };
    const result = blogSchema.safeParse(normalized);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      setFieldErrors(errors);
      setValidationMessages(Object.values(errors));
      setFormError("Please fix the highlighted fields before saving.");
      const firstField = Object.keys(errors)[0];
      if (firstField) {
        window.setTimeout(() => {
          const escaped =
            typeof CSS !== "undefined" && CSS.escape
              ? CSS.escape(firstField)
              : firstField.replace(/"/g, '\\"');
          const element = document.querySelector(
            `[data-field="${escaped}"], [name="${escaped}"]`
          );
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
      return null;
    }
    setFieldErrors({});
    setValidationMessages([]);
    return {
      ...result.data,
      tourYear: result.data.tourYear ? String(result.data.tourYear) : "",
      tourStartDate: result.data.tourStartDate || "",
      tourEndDate: result.data.tourEndDate || "",
      scheduleEndDate: result.data.scheduleEndDate || "",
      publishedAt: result.data.publishedAt || "",
    } as BlogFormValues;
  }

  async function handleSubmit(modeToSave: SaveMode, event?: React.FormEvent) {
    event?.preventDefault();
    setFormError(null);
    setValidationMessages([]);
    const validated = validate();
    if (!validated) return;

    const payload: BlogFormValues = {
      ...validated,
      status:
        modeToSave === "publish"
          ? "PUBLISHED"
          : modeToSave === "draft"
            ? "DRAFT"
            : validated.status,
    };

    setSaving(modeToSave);
    try {
      let response: { blog: Blog };
      if (mode === "edit" && blogId) {
        response = await api<{ blog: Blog }>(`/admin/blogs/${blogId}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        response = await api<{ blog: Blog }>("/admin/blogs", {
          method: "POST",
          body: payload,
        });
      }
      const next = response.blog;
      showAdminToast({
        message:
          modeToSave === "publish"
            ? "Published successfully."
            : modeToSave === "draft"
              ? "Draft saved successfully."
              : "Saved successfully.",
      });
      setSaving(null);
      navigate(`/blogs/${next.id}/edit`, {
        replace: true,
        state: { saved: true },
      });
    } catch (error) {
      setFormError(errorMessage(error));
      setSaving(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function formatPublishedAtForInput(date: Date | string | null | undefined) {
    if (!date) return "";
    const value = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(value.getTime())) return "";
    const pad = (number: number) => String(number).padStart(2, "0");
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(
      value.getUTCDate()
    )}T${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
  }

  const customEmbed = Boolean(form.widgetCode.trim());
  const tourWindow = formatDateRange(form.tourStartDate, form.tourEndDate);
  const readingMinutes = readingTime(form.content);
  const primaryAlbum = form.albums[0];
  const articleUrl = publicSiteUrl(`/tours/${form.slug || "preview"}`);
  const hasOptionalErrors = ["supportingArtists", "previousTour", "tourCities", "albums", "additionalImages"].some(
    (field) => fieldErrors[field]
  );
  const hasSeoErrors = ["metaTitle", "metaDescription", "seoKeywords"].some(
    (field) => fieldErrors[field]
  );

  return (
    <form onSubmit={(event) => handleSubmit("save", event)} className="pb-10">
      <div className="mb-5 rounded-[3px] border border-[#e5e5e5] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate("/blogs")}
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-[#dddddd] bg-white text-[#777777] transition hover:border-ember-500 hover:text-[#333333]"
              aria-label="Back to all tours"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ember-600">
                {mode === "edit" ? "Editing tour page" : "New tour page"}
              </p>
              <h1 className="mt-1 truncate font-display text-2xl font-normal uppercase leading-none text-[#535353] sm:text-3xl">
                {form.title || "Create tour page"}
              </h1>
              <p className="mt-1.5 truncate text-xs text-ink-600">
                {form.status === "PUBLISHED" ? "Published" : "Draft"} · /tours/
                {form.slug}
                {mode === "edit" && createdAtLabel ? ` · Created ${createdAtLabel}` : ""}
                {mode === "edit" && updatedAtLabel ? ` · Updated ${updatedAtLabel}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/preview/${blogId}`)}
              disabled={!blogId}
              className="btn-outline"
              title={blogId ? "Preview saved tour page" : "Save the tour page before previewing"}
            >
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={saving !== null}
              className="btn-outline"
            >
              <Save className="h-4 w-4" />
              {saving === "draft" ? "Saving..." : "Save draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("publish")}
              disabled={saving !== null}
              className="btn-primary"
            >
              <Sparkles className="h-4 w-4" />
              {saving === "publish" ? "Publishing..." : "Save & publish"}
            </button>
          </div>
        </div>
      </div>

      {formError ? (
        <div className="mx-auto mb-4 flex max-w-[1210px] items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{formError}</p>
            {validationMessages.length > 0 ? (
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {validationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="public-surface mx-auto max-w-[1210px] bg-white px-4 pb-12 pt-5 shadow-[0_1px_2px_rgba(9,9,12,0.06),0_12px_32px_-12px_rgba(9,9,12,0.18)] sm:px-5">
        <div className="grid gap-[30px] lg:grid-cols-[minmax(0,1fr)_370px]">
          <article id="content" className="min-w-0">
            <header>
              <h1 className="font-display text-[36px] uppercase leading-none text-[#535353] sm:text-[38px]">
                <input
                  aria-label="Artist name"
                  value={form.artistName}
                  onChange={(event) => set("artistName", event.target.value)}
                  placeholder="Artist name"
                  maxLength={160}
                  className={cn(
                    inlineInput,
                    "inline-block max-w-full align-baseline text-[#535353]"
                  )}
                  style={{
                    width: `${Math.max(
                      10,
                      Math.min(34, (form.artistName || "Artist name").length)
                    )}ch`,
                  }}
                />{" "}
                <span className="text-[#777777]">
                  Tour Dates{" "}
                  <input
                    aria-label="Tour year"
                    value={yearDraft}
                    onChange={(event) => changeTourYear(event.target.value)}
                    onBlur={commitTourYear}
                    onFocus={(event) => event.currentTarget.select()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    inputMode="numeric"
                    maxLength={4}
                    className={cn(
                      inlineInput,
                      "inline-block align-baseline text-[#777777]"
                    )}
                    style={{ width: "5.5ch" }}
                  />
                </span>
              </h1>

              <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#999999]">
                <li className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-[#aaaaaa]" />
                  <input
                    aria-label="Tour start date"
                    type="date"
                    value={form.tourStartDate}
                    onChange={(event) => set("tourStartDate", event.target.value)}
                    className="w-[112px] border-b border-transparent bg-transparent text-[11px] text-[#999999] outline-none transition hover:border-[#dddddd] focus:border-[#1791c7]"
                  />
                  <span>–</span>
                  <input
                    aria-label="Tour end date"
                    type="date"
                    value={form.tourEndDate}
                    onChange={(event) => set("tourEndDate", event.target.value)}
                    className="w-[112px] border-b border-transparent bg-transparent text-[11px] text-[#999999] outline-none transition hover:border-[#dddddd] focus:border-[#1791c7]"
                  />
                  {!tourWindow ? (
                    <span className="text-[#aaaaaa]">Dates to be announced</span>
                  ) : null}
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Music4 className="h-3.5 w-3.5 text-[#aaaaaa]" />
                  <select
                    aria-label="Genre"
                    value={form.genre}
                    onChange={(event) => set("genre", event.target.value)}
                    className="border-0 bg-transparent p-0 pr-5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#127794] outline-none"
                  >
                    {GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#aaaaaa]" />
                  {readingMinutes} min read
                </li>
                {form.featured ? (
                  <li className="rounded-[2px] bg-[#eaf7fc] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#127794]">
                    Featured
                  </li>
                ) : null}
              </ul>
              <div data-field="artistName">
                <FieldError message={fieldErrors.artistName} />
              </div>
              <div data-field="genre">
                <FieldError message={fieldErrors.genre} />
              </div>
              <div data-field="tourStartDate">
                <FieldError message={fieldErrors.tourStartDate} />
              </div>
              <div data-field="tourEndDate">
                <FieldError message={fieldErrors.tourEndDate} />
              </div>
              <div className="rule-accent mt-4" />
            </header>

            <div className="mt-4">
              <div
                className="mb-4 sm:float-left sm:mb-3 sm:mr-5 sm:w-[200px]"
                data-field="featuredImage"
              >
                <ImagePicker
                  label="Featured image"
                  value={form.featuredImage}
                  onChange={(url) => set("featuredImage", url)}
                  aspect="aspect-square"
                />
                <FieldError message={fieldErrors.featuredImage} />
              </div>

              <div className="text-[13px] leading-[1.8] text-[#535353]">
                <div data-field="title">
                  <input
                    aria-label="Page title"
                    value={form.title}
                    onChange={(event) => maybeAutoSlug(event.target.value)}
                    placeholder="Page title"
                    maxLength={200}
                    className={cn(
                      inlineInput,
                      "font-bold text-[#222222] placeholder:font-normal"
                    )}
                  />
                  <FieldError message={fieldErrors.title} />
                </div>
                <div className="mt-1" data-field="excerpt">
                  <textarea
                    aria-label="Short description"
                    value={form.excerpt}
                    onChange={(event) => set("excerpt", event.target.value)}
                    placeholder="Add a short description for the intro..."
                    rows={2}
                    maxLength={600}
                    className={cn(
                      inlineInput,
                      "resize-y leading-[1.8] text-[#535353]"
                    )}
                  />
                  <FieldError message={fieldErrors.excerpt} />
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5" data-field="tourName">
                  <span className="font-bold text-[#222222]">Tour:</span>
                  <input
                    aria-label="Tour name"
                    value={form.tourName}
                    onChange={(event) => set("tourName", event.target.value)}
                    placeholder="Tour name"
                    maxLength={200}
                    className={cn(inlineInput, "min-w-[12rem] flex-1")}
                  />
                  {form.supportingArtists.length > 0 ? (
                    <span className="text-[#535353]">
                      · Special guests: {form.supportingArtists.join(", ")}
                    </span>
                  ) : null}
                  <FieldError message={fieldErrors.tourName} />
                </div>
              </div>
            </div>

            <div className="clear-both" />

            <div className="mt-4" data-field="content">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#127794]">
                  Article content
                </span>
                <span className="text-[10px] text-[#999999]">
                  Headings, images and links
                </span>
              </div>
              <RichEditor
                value={form.content}
                onChange={(html) => set("content", html)}
                onUploadImage={(file) => uploadImageFile(file)}
              />
              <FieldError message={fieldErrors.content} />
            </div>

            <section className="mt-8" aria-labelledby="tour-gallery">
              <div className="flex items-end justify-between gap-3">
                <h2
                  id="tour-gallery"
                  className="font-display text-[28px] uppercase leading-none text-[#535353]"
                >
                  Tour Gallery
                </h2>
                <span className="text-[11px] text-[#999999]">
                  {form.additionalImages.length} photos
                </span>
              </div>
              <div className="rule-accent mt-2" />
              <div className="mt-4" data-field="additionalImages">
                <MultiImagePicker
                  values={form.additionalImages}
                  onChange={(urls) => set("additionalImages", urls)}
                  max={20}
                />
                <FieldError message={fieldErrors.additionalImages} />
              </div>
            </section>

            <PublicSection
              id="concert-schedule"
              title={`${form.artistName || "Artist"} Concert Schedule`}
              description="Paste the TicketNetwork widget code and the schedule, dates and ticket links will render automatically."
            >
              <div className="mt-4 rounded-[3px] border border-[#e5e5e5] bg-[#fafafa] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#535353]">
                    TicketNetwork widget
                  </span>
                  <span className="rounded-[2px] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#777777]">
                    {customEmbed ? "Code added" : "No code yet"}
                  </span>
                </div>

                <div className="mt-4" data-field="widgetCode">
                  <Field
                    label="Widget code"
                    value={form.widgetCode}
                    onChange={(value) => set("widgetCode", value)}
                    placeholder="Paste the complete <!--START WIDGET--> ... <!--END WIDGET--> code"
                    hint="Schedule dates and ticket links are read directly from this embed code."
                    rows={10}
                    maxLength={500000}
                  />
                  {customEmbed ? (
                    <p className="mt-2 rounded-[2px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      Widget code is active for this post.
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] leading-relaxed text-[#999999]">
                      Paste the widget code above to show the official concert
                      schedule.
                    </p>
                  )}
                  <FieldError message={fieldErrors.widgetCode} />
                </div>
              </div>

              <div className="mt-4">
                {customEmbed ? (
                  <div className="rounded-[3px] border border-[#dddddd] bg-white px-6 py-10 text-center">
                    <Ticket className="mx-auto h-6 w-6 text-[#127794]" />
                    <h3 className="mt-3 font-display text-2xl uppercase text-[#535353]">
                      Schedule ready to preview
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#777777]">
                      Save the tour page, then open Preview to see the live
                      TicketNetwork widget in the exact public layout.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[3px] border border-dashed border-[#cccccc] bg-[#fafafa] px-6 py-14 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf7fc] text-[#127794]">
                      <Ticket className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 font-display text-2xl uppercase text-[#535353]">
                      Ticket links coming soon
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#777777]">
                      Paste the TicketNetwork widget code above to display the
                      official dates for this tour.
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-[#999999]">
                Concert listings and ticket links are provided by the official tour
                partner. Availability and prices are set by the ticketing provider.
              </p>
            </PublicSection>

            <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Tour notes">
              <div
                className="border border-[#e5e5e5] bg-white p-4"
                data-field="supportingArtists"
              >
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#127794]">
                  <Users className="h-3.5 w-3.5" /> On the bill
                </p>
                <div className="mt-3">
                  <SupportingArtistsEditor
                    values={form.supportingArtists}
                    onChange={(values) => set("supportingArtists", values)}
                  />
                </div>
                <FieldError message={fieldErrors.supportingArtists} />
              </div>
              <div
                className="border border-[#e5e5e5] bg-white p-4"
                data-field="previousTour"
              >
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#127794]">
                  <History className="h-3.5 w-3.5" /> Previously on the road
                </p>
                <div className="mt-3">
                  <PreviousTourEditor
                    value={form.previousTour}
                    onChange={(value) => set("previousTour", value)}
                  />
                </div>
                <FieldError message={fieldErrors.previousTour} />
              </div>
            </div>

            <PublicSection
              id="tour-cities"
              title="Cities on this tour"
              action={
                <span className="text-[11px] text-[#999999]">
                  {form.tourCities.length} cities
                </span>
              }
            >
              <div className="mt-3" data-field="tourCities">
                <TourCitiesEditor
                  values={form.tourCities}
                  onChange={(values) => set("tourCities", values)}
                />
                <FieldError message={fieldErrors.tourCities} />
              </div>
            </PublicSection>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-[#eeeeee] py-4">
              <PublicShareButtons url={articleUrl} title={form.title} compact />
              <span className="text-[11px] text-[#999999]">
                {form.status === "PUBLISHED" ? "Published" : "Draft"} · {form.genre}
              </span>
            </div>
          </article>

          <aside className="space-y-5" aria-label="Tour sidebar">
            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                  {form.artistName || "Artist"} Albums
                </h2>
              </div>
              <div className="p-4">
                {primaryAlbum ? (
                  <div className="flex gap-3">
                    <div className="relative h-[130px] w-[130px] shrink-0 overflow-hidden rounded-[2px] bg-[#222222]">
                      {primaryAlbum.cover ? (
                        <img
                          src={assetUrl(primaryAlbum.cover)}
                          alt={`${primaryAlbum.title} album cover`}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col justify-between bg-gradient-to-br from-[#1791c7] to-[#222222] p-3 text-white">
                          <Disc3 className="h-5 w-5 text-white/70" />
                          <p className="font-display text-lg uppercase leading-none">
                            {primaryAlbum.title}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xl uppercase leading-none text-[#535353]">
                        {primaryAlbum.title}
                      </p>
                      {primaryAlbum.year ? (
                        <p className="mt-1 text-[11px] text-[#999999]">
                          {primaryAlbum.year}
                        </p>
                      ) : null}
                      {primaryAlbum.tracks.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {primaryAlbum.tracks.slice(0, 3).map((track) => (
                            <li
                              key={track}
                              className="truncate text-[11px] text-[#777777]"
                            >
                              · {track}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#777777]">
                    Album details have not been added yet.
                  </p>
                )}
                {form.albums.length > 0 ? (
                  <a
                    href="#tour-albums"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#127794] hover:underline"
                  >
                    View all albums <ChevronRight className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                  Tour Details
                </h2>
              </div>
              <dl className="divide-y divide-[#f0f0f0] px-4 py-2 text-xs">
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Artist</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {form.artistName || "—"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Genre</dt>
                  <dd className="text-right font-bold text-[#535353]">{form.genre}</dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Dates</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {tourWindow || "To be announced"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Cities</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {form.tourCities.length || "—"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-[#999999]">Albums</dt>
                  <dd className="text-right font-bold text-[#535353]">
                    {form.albums.length || "—"}
                  </dd>
                </div>
              </dl>
              <div className="px-4 pb-4">
                <a href="#concert-schedule" className="btn-primary w-full">
                  <Ticket className="h-4 w-4" /> View schedule
                </a>
              </div>
            </div>

            <div className="bg-[#1791c7] p-5 text-white">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                <ShieldCheck className="h-3.5 w-3.5" /> Official ticket links
              </p>
              <h2 className="mt-1 font-display text-[26px] uppercase leading-none text-white">
                Plan your night
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
                Dates and ticket links are provided by our official tour partner. Always
                check the venue and provider before purchasing.
              </p>
              <a
                href={publicSiteUrl("/contact")}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-8 items-center justify-center rounded-[3px] bg-white px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#333333] transition hover:bg-[#222222] hover:text-white"
              >
                Contact us <ChevronRight className="h-3 w-3" />
              </a>
            </div>

            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                  Browse by Genre
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {PUBLIC_GENRES.map((genre) => (
                  <a
                    key={genre}
                    href={publicSiteUrl(`/tours?genre=${encodeURIComponent(genre)}`)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "rounded-[2px] px-2.5 py-1.5 text-[11px] transition",
                      genre === form.genre
                        ? "bg-[#1791c7] text-white"
                        : "bg-[#f5f5f5] text-[#535353] hover:bg-[#eaf7fc] hover:text-[#127794]"
                    )}
                  >
                    {genre}
                  </a>
                ))}
              </div>
            </div>

            <div className="border border-[#e5e5e5] bg-white">
              <div className="border-b border-[#eeeeee] px-4 py-3">
                <h2 className="font-display text-xl uppercase leading-none text-[#535353]">
                  Publishing
                </h2>
              </div>
              <div className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div data-field="status">
                    <label htmlFor="status" className="field-label">
                      Status
                    </label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(event) => {
                        const status = event.target.value as BlogStatus;
                        set("status", status);
                        if (status === "PUBLISHED" && !form.publishedAt) {
                          set("publishedAt", formatPublishedAtForInput(new Date()));
                        }
                      }}
                      className="input"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                    <FieldError message={fieldErrors.status} />
                  </div>
                  <div data-field="publishedAt">
                    <Field
                      label="Publish date"
                      type="datetime-local"
                      value={form.publishedAt}
                      onChange={(value) => set("publishedAt", value)}
                    />
                    <FieldError message={fieldErrors.publishedAt} />
                  </div>
                </div>

                <div data-field="slug">
                  <Field
                    label="Page URL"
                    value={form.slug}
                    onChange={(value) => set("slug", value)}
                    placeholder="artist-tour-name"
                    hint="Appears as /tours/your-slug."
                    maxLength={140}
                  />
                  <FieldError message={fieldErrors.slug} />
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-[2px] border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => set("featured", event.target.checked)}
                    className="h-4 w-4 rounded border-[#bebebe] text-[#1791c7]"
                  />
                  <span className="text-xs font-bold text-[#535353]">
                    Feature on homepage
                  </span>
                </label>
              </div>
            </div>

            <div className="border border-[#e5e5e5] bg-white p-4">
              <h2 className="flex items-center gap-2 font-display text-xl uppercase leading-none text-[#535353]">
                <Music2 className="h-4 w-4 text-[#127794]" /> More live music
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">
                Explore every published tour announcement and find your next show.
              </p>
              <a
                href={publicSiteUrl("/tours")}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#127794] hover:underline"
              >
                All tours <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          </aside>
        </div>

        <PublicSection
          id="tour-albums"
          title="Albums & Popular Songs"
          description="Get familiar with the records behind the setlist before the show."
          className="border-t border-[#eeeeee] pt-8"
          action={
            <span className="text-[11px] text-[#999999]">
              {form.albums.length} releases
            </span>
          }
        >
          {form.albums.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {form.albums.map((album, index) => (
                <article
                  key={`${album.title}-${index}`}
                  className="flex overflow-hidden border border-[#e5e5e5] bg-white"
                >
                  <AlbumCover album={album} />
                  <div className="min-w-0 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl uppercase leading-none text-[#535353]">
                        {album.title || "Untitled album"}
                      </h3>
                      {album.year ? (
                        <span className="shrink-0 text-[10px] text-[#999999]">
                          {album.year}
                        </span>
                      ) : null}
                    </div>
                    {album.description ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#777777]">
                        {album.description}
                      </p>
                    ) : null}
                    {album.tracks.length > 0 ? (
                      <p className="mt-2 truncate text-[10px] text-[#999999]">
                        {album.tracks.slice(0, 3).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[3px] border border-dashed border-[#cccccc] bg-[#fafafa] px-6 py-10 text-center text-xs text-[#777777]">
              No albums added yet. Add releases below to show the discography section.
            </div>
          )}

          <details
            className="mt-5 rounded-[3px] border border-[#e5e5e5] bg-white p-4"
            open={fieldErrors.albums ? true : undefined}
          >
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.12em] text-[#777777]">
              Edit albums and popular tracks
            </summary>
            <div className="mt-4" data-field="albums">
              <AlbumsEditor
                albums={form.albums}
                onChange={(albums) => set("albums", albums)}
              />
              <FieldError message={fieldErrors.albums} />
            </div>
          </details>
        </PublicSection>

        <PublicSection
          id="seo-social"
          title="SEO & Sharing"
          description="Optional search title, description and keywords used by search engines and social cards."
          className="border-t border-[#eeeeee] pt-8"
        >
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2" data-field="metaTitle">
              <Field
                label="Meta title"
                value={form.metaTitle}
                onChange={(value) => set("metaTitle", value)}
                placeholder="Defaults to the page title"
                hint={`${form.metaTitle.length}/200 characters`}
                maxLength={200}
              />
              <FieldError message={fieldErrors.metaTitle} />
            </div>
            <div data-field="metaDescription">
              <Field
                label="Meta description"
                value={form.metaDescription}
                onChange={(value) => set("metaDescription", value)}
                placeholder="A short summary for search results and social cards."
                hint={`${form.metaDescription.length}/400 characters`}
                rows={3}
                maxLength={400}
              />
              <FieldError message={fieldErrors.metaDescription} />
            </div>
            <div data-field="seoKeywords">
              <Field
                label="SEO keywords"
                value={form.seoKeywords}
                onChange={(value) => set("seoKeywords", value)}
                placeholder="concert, tour dates, live music"
                maxLength={600}
              />
              <FieldError message={fieldErrors.seoKeywords} />
            </div>
          </div>
          {hasOptionalErrors || hasSeoErrors ? (
            <p className="mt-3 text-xs font-medium text-red-600">
              Some optional fields above need attention before saving.
            </p>
          ) : null}
        </PublicSection>

        <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-[#eeeeee] pt-5">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving !== null}
            className="btn-outline"
          >
            <Save className="h-4 w-4" />
            {saving === "draft" ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("publish")}
            disabled={saving !== null}
            className="btn-primary"
          >
            <Sparkles className="h-4 w-4" />
            {saving === "publish" ? "Publishing..." : "Save & publish"}
          </button>
        </div>
      </div>
    </form>
  );
}
