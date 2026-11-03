import { prisma } from "../prisma.js";
import { normalizePublishedAt, slugify } from "../utils.js";
import { sanitizeArticle } from "./sanitize.js";

export async function uniqueSlug(base, excludeId) {
  const root = slugify(base).slice(0, 120) || `tour-${Date.now()}`;
  let candidate = root;
  let counter = 2;
  for (;;) {
    const existing = await prisma.blog.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${root}-${counter}`;
    counter += 1;
  }
}

export async function blogData(input, existing) {
  const slug = await uniqueSlug(input.slug || input.title, existing?.id);
  const toDate = (value) => (value ? new Date(value) : null);

  return {
    title: input.title,
    slug,
    excerpt: input.excerpt,
    artistName: input.artistName,
    tourName: input.tourName,
    genre: input.genre,
    tourStartDate: toDate(input.tourStartDate),
    tourEndDate: toDate(input.tourEndDate),
    featuredImage: input.featuredImage,
    additionalImages: JSON.stringify(input.additionalImages || []),
    supportingArtists: JSON.stringify(input.supportingArtists || []),
    previousTour: input.previousTour,
    albums: JSON.stringify(input.albums || []),
    tourCities: JSON.stringify(input.tourCities || []),
    content: sanitizeArticle(input.content),
    widgetEnabled: input.widgetEnabled,
    widgetCode: input.widgetCode,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    seoKeywords: input.seoKeywords,
    status: input.status,
    featured: input.featured,
    publishedAt: normalizePublishedAt(input.status, input.publishedAt, existing?.publishedAt),
  };
}
