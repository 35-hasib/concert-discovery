"use strict";

const SITE_NAME_FALLBACK = "Concert Discovery";
const API_TIMEOUT_MS = 8000;
const TEMPLATE_TIMEOUT_MS = 5000;
const TEMPLATE_TTL_MS = 5 * 60 * 1000;
const SETTINGS_TTL_MS = 60 * 1000;

const STATIC_ROUTES = {
  "/": true,
  "/tours": true,
  "/contact": true,
  "/privacy": true,
  "/terms": true,
};

const TOUR_PATTERN = /^\/tours\/([a-z0-9-]{1,160})\/?$/i;

let templateCache = null;
let settingsCache = null;

function backendOrigin() {
  return (process.env.BACKEND_ORIGIN || "https://concert-discovery.onrender.com").replace(/\/+$/, "");
}

function resolveSiteOrigin(headers) {
  const protoHeader = String(headers["x-forwarded-proto"] || "");
  const proto = protoHeader.split(",")[0].trim() || "https";
  const hostHeader = headers["x-forwarded-host"] || headers.host || "concert-discovery.vercel.app";
  const host = String(hostHeader).split(",")[0].trim();
  return `${proto}://${host}`;
}

function getSiteOrigin(headers) {
  return (process.env.SITE_URL || "").replace(/\/+$/, "") || resolveSiteOrigin(headers);
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(html) {
  return String(html || "")
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

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateShort = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatDateShort(value) {
  const date = toDate(value);
  return date ? dateShort.format(date) : "";
}

function formatDateRange(start, end) {
  if (!start && !end) return "";
  if (start && end) return `${formatDateShort(start)} \u2013 ${formatDateShort(end)}`;
  return formatDateShort(start || end);
}

function absoluteAssetUrl(value, siteOrigin, origin) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/uploads/")) return `${origin}${value}`;
  return `${siteOrigin}${value.startsWith("/") ? value : `/${value}`}`;
}

function rewriteContentImages(contentHtml, origin) {
  return String(contentHtml || "").replace(
    /(<img\b[^>]*\bsrc=["'])\/uploads\/([^"']*)(["'])/gi,
    (_match, lead, rest, tail) => `${lead}${origin}/uploads/${rest}${tail}`
  );
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return { ok: false, status: response.status, data: null };
    const data = await response.json();
    return { ok: true, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

async function getSettings(apiBase) {
  if (settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL_MS) {
    return settingsCache.settings;
  }
  const result = await fetchJson(`${apiBase}/settings`, Math.min(API_TIMEOUT_MS, 4000));
  const settings = result.ok && result.data ? result.data.settings || {} : null;
  if (settings) settingsCache = { at: Date.now(), settings };
  return settings;
}

async function getTemplate(siteOrigin) {
  if (templateCache && Date.now() - templateCache.at < TEMPLATE_TTL_MS) {
    return templateCache.html;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TEMPLATE_TIMEOUT_MS);
    const response = await fetch(`${siteOrigin}/index.html`, {
      signal: controller.signal,
      headers: { accept: "text/html" },
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`Template responded ${response.status}`);
    const html = await response.text();
    if (!/<div id="root"/i.test(html)) throw new Error("Template has no app root");
    templateCache = { at: Date.now(), html };
    return html;
  } catch (error) {
    if (templateCache && templateCache.html) return templateCache.html;
    throw error;
  }
}

function buildHeadTags({ title, description, canonical, robots, ogType, ogImage, ogImageAlt, keywords, publishedTime, modifiedTime, jsonLdObjects, siteName }) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${escapeHtml(robots)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
  ];
  if (canonical) {
    tags.push(
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`
    );
  }
  if (keywords) tags.push(`<meta name="keywords" content="${escapeHtml(keywords)}" />`);
  if (ogImage) tags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`);
  if (ogImageAlt) tags.push(`<meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}" />`);
  for (const [property, value] of publishedTime ? [["article:published_time", publishedTime]] : []) {
    tags.push(`<meta property="${property}" content="${escapeHtml(value)}" />`);
  }
  if (modifiedTime) tags.push(`<meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />`);
  tags.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );
  if (ogImage) tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);
  if (jsonLdObjects && jsonLdObjects.length) {
    tags.push(`<script type="application/ld+json">${jsonLd(jsonLdObjects)}</script>`);
  }
  return tags.join("\n    ");
}

function composeDocument(template, headTags, bodyContent) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace(/<meta\s+name="robots"[^>]*>/i, "");
  const charsetPattern = /<meta\s+charset=[^>]*>/i;
  if (charsetPattern.test(html)) {
    html = html.replace(charsetPattern, (match) => `${match}\n    ${headTags}`);
  } else {
    html = html.replace(/<head(\s[^>]*)?>/i, `<head$1>\n    ${headTags}`);
  }
  if (bodyContent) {
    const replaced = html.replace(
      /(<div id="root">)([\s\S]{0,200}?)(<\/div>)/i,
      `$1${bodyContent}$3`
    );
    html = replaced === html ? html.replace(/<\/body>/i, `<div id="root">${bodyContent}</div></body>`) : replaced;
  }
  return html;
}

function buildTourBody({ blog, siteOrigin, origin }) {
  const year =
    blog.tourYear ??
    (blog.tourStartDate
      ? new Date(blog.tourStartDate).getUTCFullYear()
      : new Date(blog.publishedAt || blog.createdAt).getUTCFullYear());
  const tourWindow = formatDateRange(blog.tourStartDate, blog.tourEndDate);
  const imageSrc = blog.featuredImage
    ? absoluteAssetUrl(blog.featuredImage, siteOrigin, origin)
    : `${siteOrigin}/icon.svg`;
  const content = rewriteContentImages(blog.content, origin);
  const genreHref = `/tours?genre=${encodeURIComponent(String(blog.genre || ""))}`;
  const hasSchedule = blog.scheduleSummary ? blog.scheduleSummary.source !== "none" : true;

  return `<div data-prerendered="true" class="container-page bg-white px-5 pb-12 pt-5"><div class="grid gap-[30px] lg:grid-cols-[minmax(0,1fr)_370px]"><article id="content" class="min-w-0"><nav class="flex flex-wrap items-center gap-1.5 rounded-[2px] bg-[#f5f5f5] px-[15px] py-2 text-[11px] text-[#888888]" aria-label="Breadcrumb"><a href="/" class="hover:text-ember-600">Home</a><span>/</span><a href="/tours" class="hover:text-ember-600">All Tours</a><span>/</span><span>${escapeHtml(blog.title)}</span></nav><header><h1 class="font-display text-[36px] uppercase leading-none text-[#535353] sm:text-[38px]">${escapeHtml(blog.artistName)} <span class="text-[#777777]">Tour Dates ${escapeHtml(year)}</span></h1><ul class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[#999999]"><li class="inline-flex items-center gap-1.5">${escapeHtml(tourWindow || "Dates to be announced")}</li><li class="inline-flex items-center gap-1.5"><a href="${escapeHtml(genreHref)}" class="uppercase tracking-[0.06em] text-ember-600 hover:underline">${escapeHtml(blog.genre)}</a></li></ul><div class="rule-accent mt-4"></div></header>${blog.featuredImage ? `<a href="${escapeHtml(`${siteOrigin}/tours/${blog.slug}`)}" class="mb-4 block overflow-hidden bg-[#222222] sm:float-left sm:mb-3 sm:mr-5 sm:w-[200px]"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(blog.artistName)}" class="h-[200px] w-full object-cover" /></a>` : ""}<div class="text-[13px] leading-[1.8] text-[#535353]"><p><strong class="font-bold text-[#222222]">${escapeHtml(blog.title)}</strong>${blog.excerpt ? ` \u2014 ${escapeHtml(blog.excerpt)}` : ""}</p>${blog.tourName ? `<p class="mt-2"><b>Tour:</b> ${escapeHtml(blog.tourName)}</p>` : ""}</div><div class="clear-both"></div><div class="prose-article mt-4 [&amp;>*:first-child]:mt-0 text-[13px] leading-[1.8] text-[#535353]">${content}</div><section id="concert-schedule"><h2 class="mt-9 font-display text-[32px] uppercase leading-none text-[#535353]">${escapeHtml(blog.artistName)} Concert Schedule</h2><p class="mt-1 text-[12px] text-[#777777]">Browse upcoming dates and follow official ticket links to secure your seats. The full schedule loads just below.</p></section></article></div></div>`;
}

function buildNotFoundBody() {
  return `<div data-prerendered="true" class="container-page flex min-h-[60vh] flex-col items-center justify-center bg-white px-5 py-20 text-center"><h1 class="font-display text-4xl uppercase text-[#535353]">Tour not found</h1><p class="mt-2 max-w-md text-sm text-[#777777]">This announcement does not exist, was unpublished, or moved to a new URL.</p><a href="/tours" class="btn-primary mt-6">Browse all tours</a></div>`;
}

function buildTourDocument({ blog, settingsName, siteOrigin, origin, apiBase }) {
  const title = `${blog.metaTitle || `${blog.title} by ${blog.artistName}`} | ${settingsName}`;
  const description =
    blog.metaDescription || blog.excerpt || stripHtml(blog.content).slice(0, 160) || "Concert tour announcement.";
  const canonical = `${siteOrigin}/tours/${blog.slug}`;
  const image = blog.featuredImage
    ? absoluteAssetUrl(blog.featuredImage, siteOrigin, origin)
    : absoluteAssetUrl("/icon.svg", siteOrigin, origin);
  const published = blog.publishedAt || blog.createdAt;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description,
    image: [image],
    datePublished: new Date(published).toISOString(),
    dateModified: new Date(blog.updatedAt || published).toISOString(),
    author: { "@type": "Person", name: blog.artistName || settingsName },
    publisher: { "@type": "Organization", name: settingsName, logo: { "@type": "ImageObject", url: absoluteAssetUrl("/icon.svg", siteOrigin, origin) } },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    articleSection: blog.tourName || blog.genre || undefined,
    keywords: blog.seoKeywords || undefined,
    about: blog.artistName ? { "@type": "MusicGroup", name: blog.artistName, genre: blog.genre || undefined } : undefined,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteOrigin}/` },
      { "@type": "ListItem", position: 2, name: "All Tours", item: `${siteOrigin}/tours` },
      { "@type": "ListItem", position: 3, name: blog.title, item: canonical },
    ],
  };

  const jsonLdObjects = [articleSchema, breadcrumbSchema];
  if (Array.isArray(blog.albums) && blog.albums.length > 0) {
    jsonLdObjects.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${blog.artistName} albums`,
      itemListElement: blog.albums.map((album, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MusicAlbum",
          name: album.title,
          datePublished: album.year || undefined,
          image: album.cover ? absoluteAssetUrl(album.cover, siteOrigin, origin) : undefined,
          numTracks: album.tracks && album.tracks.length ? album.tracks.length : undefined,
          byArtist: { "@type": "MusicGroup", name: blog.artistName },
        },
      })),
    });
  }

  const head = buildHeadTags({
    title,
    description,
    canonical,
    robots: "index, follow",
    ogType: "article",
    ogImage: image,
    ogImageAlt: blog.title || "Tour announcement",
    keywords: blog.seoKeywords,
    publishedTime: new Date(published).toISOString(),
    modifiedTime: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
    jsonLdObjects,
    siteName: settingsName,
  });

  return {
    status: 200,
    cacheControl: "public, max-age=0, s-maxage=120, stale-while-revalidate=1800",
    html: null,
    head,
    body: buildTourBody({ blog, siteOrigin, origin }),
  };
}

function buildTourNotFoundDocument({ apiBase, siteOrigin }) {
  const head = buildHeadTags({
    title: `Tour not found | ${SITE_NAME_FALLBACK}`,
    description: "This tour announcement does not exist, was unpublished, or moved to a new URL.",
    canonical: "",
    robots: "noindex, follow",
    ogType: "website",
    jsonLdObjects: [],
    siteName: SITE_NAME_FALLBACK,
  });
  return {
    status: 404,
    cacheControl: "public, max-age=0, s-maxage=60",
    noindexHeader: true,
    html: null,
    head,
    body: buildNotFoundBody(),
  };
}

function buildTourFallbackDocument({ apiBase, siteOrigin, origin, routePath }) {
  const canonical = /^\/tours\/[a-z0-9-]+\/?$/i.test(routePath || "")
    ? `${siteOrigin}${routePath.replace(/\/+$/, "")}`
    : `${siteOrigin}/tours`;
  const head = buildHeadTags({
    title: `Tour announcement | ${SITE_NAME_FALLBACK}`,
    description: "Concert tour announcement with dates, concert schedule and official ticket links.",
    canonical,
    robots: "index, follow",
    ogType: "website",
    jsonLdObjects: [],
    siteName: SITE_NAME_FALLBACK,
  });
  return {
    status: 200,
    cacheControl: "public, max-age=0, s-maxage=30",
    html: null,
    head,
    body: "",
  };
}

function buildStaticDocument({ route, settings, siteOrigin, origin }) {
  const websiteName = settings?.websiteName || SITE_NAME_FALLBACK;
  const tagline = settings?.tagline || "";
  let title;
  let description;
  let jsonLdObjects = [];

  if (route === "/") {
    title = settings?.defaultSeoTitle || `${websiteName}${tagline ? ` - ${tagline}` : ""}`;
    description = settings?.defaultSeoDescription || settings?.description || "Concert tour announcements and concert schedules.";
    jsonLdObjects = [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: websiteName,
        description,
        url: `${siteOrigin}/`,
      },
    ];
  } else if (route === "/tours") {
    title = `All Concert Tours | ${websiteName}`;
    description =
      "Browse every published concert tour announcement. Filter by genre, search by artist and find your next live show.";
  } else if (route === "/contact") {
    title = `Contact | ${websiteName}`;
    description = `Contact ${websiteName}.`;
  } else if (route === "/privacy") {
    title = `Privacy Policy | ${websiteName}`;
    description = `Privacy Policy for ${websiteName}.`;
  } else {
    title = `Terms of Service | ${websiteName}`;
    description = `Terms of Service for ${websiteName}.`;
  }

  const head = buildHeadTags({
    title,
    description,
    canonical: `${siteOrigin}${route}`,
    robots: "index, follow",
    ogType: "website",
    jsonLdObjects,
    siteName: websiteName,
  });

  return {
    status: 200,
    cacheControl: "public, max-age=0, s-maxage=120, stale-while-revalidate=600",
    html: null,
    head,
    body: "",
  };
}

function renderRoute({ routePath, apiBase, siteOrigin, origin, blog, settings, fetchError }) {
  const tourMatch = TOUR_PATTERN.exec(routePath);
  if (tourMatch) {
    const slug = tourMatch[1].toLowerCase();
    if (fetchError || (blog === undefined)) {
      return buildTourFallbackDocument({ apiBase, siteOrigin, origin, routePath });
    }
    if (!blog || blog.status !== "PUBLISHED") {
      return buildTourNotFoundDocument({ apiBase, siteOrigin });
    }
    return buildTourDocument({
      blog,
      settingsName: settings?.websiteName || SITE_NAME_FALLBACK,
      siteOrigin,
      origin,
      apiBase,
    });
  }

  if (STATIC_ROUTES[routePath]) {
    return buildStaticDocument({ route: routePath, settings, siteOrigin, origin });
  }

  return null;
}

async function serveRoute(req, res) {
  const requestUrl = new URL(req.url, "http://localhost");
  const routePathRaw = requestUrl.searchParams.get("path") || "/";
  let routePath;
  try {
    routePath = decodeURIComponent(routePathRaw);
  } catch (error) {
    routePath = routePathRaw;
  }
  routePath = routePath.split("?")[0].slice(0, 300);
  if (routePath.length > 1 && routePath.endsWith("/")) {
    routePath = routePath.replace(/\/+$/, "") || "/";
  }

  const apiBase = `${backendOrigin()}/api`;
  const siteOrigin = getSiteOrigin(req.headers);
  const origin = backendOrigin();

  const tourMatch = TOUR_PATTERN.exec(routePath);
  let blog;
  let fetchError = false;
  if (tourMatch) {
    const slug = tourMatch[1].toLowerCase();
    const result = await fetchJson(`${apiBase}/blogs/${encodeURIComponent(slug)}`, API_TIMEOUT_MS);
    if (!result.ok) {
      fetchError = result.status !== 404;
      blog = null;
    } else {
      blog = (result.data && result.data.blog) || null;
    }
  }

  const settings = STATIC_ROUTES[routePath] || tourMatch ? await getSettings(apiBase) : null;

  const rendered = renderRoute({
    routePath,
    apiBase,
    siteOrigin,
    origin,
    blog,
    settings,
    fetchError,
  });

  if (!rendered) {
    return null;
  }

  let template;
  try {
    template = await getTemplate(siteOrigin);
  } catch (error) {
    return null;
  }

  rendered.html = composeDocument(template, rendered.head, rendered.body);
  return rendered;
}

async function handler(req, res) {
  try {
    const rendered = await serveRoute(req, res);
    if (!rendered) {
      res.statusCode = 503;
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Retry-After", "5");
      res.end("SEO service is temporarily unavailable.");
      return;
    }
    res.statusCode = rendered.status;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Vary", "Accept-Encoding");
    res.setHeader("Cache-Control", rendered.cacheControl);
    if (rendered.noindexHeader) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    res.end(rendered.html);
  } catch (error) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Retry-After", "5");
    res.end("SEO service is temporarily unavailable.");
  }
}

module.exports = {
  handler,
  renderRoute,
  buildTourDocument,
  buildTourBody,
  buildNotFoundDocument: buildTourNotFoundDocument,
  buildStaticDocument,
  composeDocument,
};
