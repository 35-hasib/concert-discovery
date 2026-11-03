export function slugify(value) {
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

export function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingTime(html) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function parseStringList(value) {
  const parsed = safeJsonParse(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseAdditionalImages(value) {
  return parseStringList(value);
}

export function parseAlbums(value) {
  const parsed = safeJsonParse(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const tracks = Array.isArray(item.tracks)
        ? item.tracks
            .filter((track) => typeof track === "string")
            .map((track) => track.trim())
            .filter(Boolean)
        : [];
      return {
        title: typeof item.title === "string" ? item.title.trim() : "",
        year:
          typeof item.year === "string" || typeof item.year === "number"
            ? String(item.year).trim()
            : "",
        cover: typeof item.cover === "string" ? item.cover.trim() : "",
        description: typeof item.description === "string" ? item.description.trim() : "",
        tracks,
      };
    })
    .filter((album) => album.title);
}

function parseDateValue(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readWidgetProperty(fragment, name) {
  const pattern =
    "(?:^|[,{\\s])[\"']?" +
    name +
    "[\"']?\\s*:\\s*(?:\"([^\"]*)\"|'([^']*)'|\\x60([^\\x60]*)\\x60)";
  const match = new RegExp(pattern, "i").exec(fragment);
  if (!match) return "";
  return String(match[1] ?? match[2] ?? match[3] ?? "").trim();
}

function readTagAttribute(tag, name) {
  const pattern = "\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))";
  const match = new RegExp(pattern, "i").exec(tag);
  if (!match) return "";
  return String(match[1] ?? match[2] ?? match[3] ?? "").trim();
}

function extractWidgetEvents(widgetCode) {
  if (!widgetCode || typeof widgetCode !== "string") return [];
  const events = [];
  const objectPattern = /\{[^{}]{0,2400}\}/g;
  let match;
  while ((match = objectPattern.exec(widgetCode))) {
    const fragment = match[0];
    if (!/date/i.test(fragment) || !/city/i.test(fragment)) continue;
    const date = parseDateValue(readWidgetProperty(fragment, "date"));
    const city = readWidgetProperty(fragment, "city");
    if (!date || !city) continue;
    events.push({ date, city, venue: readWidgetProperty(fragment, "venue") });
  }

  const tagPattern = /<[^>]*\bdata-date\s*=[^>]*>/gi;
  while ((match = tagPattern.exec(widgetCode))) {
    const tag = match[0];
    const date = parseDateValue(readTagAttribute(tag, "data-date"));
    const city = readTagAttribute(tag, "data-city");
    if (!date || !city) continue;
    events.push({ date, city, venue: readTagAttribute(tag, "data-venue") });
  }

  const seen = new Set();
  return events
    .filter((event) => {
      const key = `${event.date.toISOString()}|${event.city.toLowerCase()}|${event.venue.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function buildScheduleSummary(blog) {
  const events = extractWidgetEvents(blog.widgetCode);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const upcoming = events.filter((event) => event.date.getTime() >= today);

  if (events.length > 0) {
    const next = upcoming[0] || null;
    return {
      concertsRemaining: upcoming.length,
      totalConcerts: events.length,
      nextConcert: next
        ? { city: next.city, date: next.date.toISOString(), venue: next.venue || "" }
        : null,
      source: "widget",
    };
  }

  const cities = parseStringList(blog.tourCities);
  const start = parseDateValue(blog.tourStartDate);
  const nextConcert = start
    ? {
        city: cities[0] || blog.tourName || blog.artistName || "",
        date: start.toISOString(),
        venue: "",
      }
    : null;

  return {
    concertsRemaining: cities.length,
    totalConcerts: cities.length,
    nextConcert,
    source: cities.length > 0 || start ? "tour" : "none",
  };
}

export function serializeBlog(blog) {
  return {
    ...blog,
    additionalImages: parseAdditionalImages(blog.additionalImages),
    supportingArtists: parseStringList(blog.supportingArtists),
    albums: parseAlbums(blog.albums),
    tourCities: parseStringList(blog.tourCities),
    readingTime: readingTime(blog.content),
    scheduleSummary: buildScheduleSummary(blog),
  };
}

export function serializeSettings(setting) {
  return {
    websiteName: setting?.websiteName || "",
    tagline: setting?.tagline || "",
    logo: setting?.logo || "",
    favicon: setting?.favicon || "",
    description: setting?.description || "",
    contactEmail: setting?.contactEmail || "",
    socialLinks: safeJsonParse(setting?.socialLinks, {}),
    defaultSeoTitle: setting?.defaultSeoTitle || "",
    defaultSeoDescription: setting?.defaultSeoDescription || "",
  };
}

export function normalizePublishedAt(status, value, previous) {
  const parsed = value ? new Date(value) : null;
  if (status === "PUBLISHED") {
    if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
    return previous || new Date();
  }
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  return null;
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
}

export function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
