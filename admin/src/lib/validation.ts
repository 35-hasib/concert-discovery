import { z } from "zod";

import { BLOG_STATUSES, GENRES } from "./constants";

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  });

const optionalYear = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.coerce.number().int().min(1900, "Enter a valid tour year").max(2100, "Enter a valid tour year").nullable()
);

const stringList = (maxItems: number, maxLength: number) =>
  z
    .array(z.string().max(maxLength))
    .max(maxItems)
    .default([])
    .transform((items) => items.map((item) => item.trim()).filter(Boolean));

const albumSchema = z.object({
  title: z.string().trim().max(200).default(""),
  year: z.string().trim().max(20).default(""),
  cover: z.string().trim().max(1000).default(""),
  description: z.string().trim().max(1500).default(""),
  tracks: stringList(100, 200),
});

export const adminAccountSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(200, "Email is too long"),
    currentPassword: z.string().min(1, "Current password is required").max(200),
    newPassword: z.string().max(200, "New password is too long").default(""),
    confirmPassword: z.string().max(200, "Confirm password is too long").default(""),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword || value.confirmPassword) {
      if (value.newPassword.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["newPassword"],
          message: "New password must be at least 8 characters",
        });
      }
      if (value.newPassword !== value.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
      }
    }
  });

export const blogSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
    slug: z
      .string()
      .trim()
      .max(140, "Slug is too long")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only")
      .optional()
      .or(z.literal("")),
    excerpt: z.string().trim().max(600, "Excerpt is too long").default(""),
    artistName: z
      .string()
      .trim()
      .min(1, "Artist name is required")
      .max(160, "Artist name is too long"),
    tourName: z.string().trim().max(200, "Tour name is too long").default(""),
    genre: z.enum(GENRES),
    tourYear: optionalYear,
    tourStartDate: optionalDate,
    tourEndDate: optionalDate,
    featuredImage: z.string().trim().max(1000).default(""),
    additionalImages: z.array(z.string().trim().max(1000)).max(20).default([]),
    supportingArtists: stringList(20, 160),
    previousTour: z.string().trim().max(2000).default(""),
    albums: z
      .array(albumSchema)
      .max(12)
      .default([])
      .transform((items) => items.filter((item) => item.title)),
    tourCities: stringList(120, 120),
    content: z.string().min(1, "Blog content is required").max(500_000, "Blog content is too large"),
    widgetEnabled: z.boolean().default(false),
    widgetCode: z.string().max(500_000, "Widget code is too large").default(""),
    scheduleArtistQuery: z
      .string()
      .trim()
      .max(160, "Artist search query is too long")
      .default(""),
    scheduleEndDate: optionalDate,
    scheduleAffiliateUrl: z
      .string()
      .trim()
      .max(2000, "Affiliate URL is too long")
      .refine(
        (value) => !value || /^https?:\/\//i.test(value) || /^\/\//.test(value),
        "Enter a valid http(s) affiliate URL"
      )
      .default(""),
    schedulePerPage: z.coerce
      .number()
      .int()
      .min(1, "Show at least 1 event per page")
      .max(100, "Show at most 100 events per page")
      .default(24),
    metaTitle: z.string().trim().max(200).default(""),
    metaDescription: z.string().trim().max(400).default(""),
    seoKeywords: z.string().trim().max(600).default(""),
    status: z.enum(BLOG_STATUSES).default("DRAFT"),
    featured: z.boolean().default(false),
    publishedAt: optionalDate,
  })
  .superRefine((value, ctx) => {
    if (value.status === "PUBLISHED" && !value.content.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Published posts require article content",
      });
    }
    if (value.widgetEnabled && !value.widgetCode.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["widgetCode"],
        message: "Add the TicketNetwork widget code",
      });
    }
    if (value.tourStartDate && value.tourEndDate) {
      if (new Date(value.tourEndDate) < new Date(value.tourStartDate)) {
        ctx.addIssue({
          code: "custom",
          path: ["tourEndDate"],
          message: "Tour end date must be after the start date",
        });
      }
    }
  });

const socialUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Enter a valid URL")
  .optional()
  .or(z.literal(""));

export const settingsSchema = z.object({
  websiteName: z.string().trim().min(1, "Website name is required").max(120),
  tagline: z.string().trim().max(220).default(""),
  logo: z.string().trim().max(1000).default(""),
  favicon: z.string().trim().max(1000).default(""),
  description: z.string().trim().max(1500).default(""),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email"),
  socialLinks: z
    .object({
      twitter: socialUrl,
      facebook: socialUrl,
      instagram: socialUrl,
      youtube: socialUrl,
      tiktok: socialUrl,
    })
    .partial()
    .default({}),
  defaultSeoTitle: z.string().trim().max(220).default(""),
  defaultSeoDescription: z.string().trim().max(500).default(""),
});

export function formatZodErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
