"use strict";
// Local SEO renderer test harness.
// Usage: node scripts/test-seo.cjs [path-to-dist]
// Run after `npm --prefix frontend run build`.

const fs = require("node:fs");
const path = require("node:path");

const distDir = process.argv[2] || path.resolve(__dirname, "..", "dist");
const templatePath = path.join(distDir, "index.html");
if (!fs.existsSync(templatePath)) {
  console.error(`dist/index.html not found at ${templatePath}. Run "npm --prefix frontend run build" first.`);
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf8");

const SITE = "https://concert-discovery.vercel.app";
const BACKEND = "https://concert-discovery.onrender.com";
const API = `${BACKEND}/api`;

const nickelback = {
  id: "nbk_1",
  slug: "nickelback-tour-dates-2026-2027-concert-schedule-tickets",
  status: "PUBLISHED",
  title: "Nickelback Announces 2026-2027 World Tour",
  metaTitle: "Nickelback Tour Dates 2026-2027",
  artistName: "Nickelback",
  tourName: "Get Rollin' World Tour",
  genre: "Rock",
  excerpt: "Nickelback hits the road again with a massive 2026-2027 world tour.",
  metaDescription: "Full Nickelback tour dates for 2026-2027 with venues, cities and official ticket links.",
  seoKeywords: "nickelback tour, nickelback tickets 2026",
  content:
    "<h2>Tour Overview</h2><p>Nickelback returns to arenas across North America and Europe.</p><img src=\"/uploads/nb-live.jpg\" alt=\"Nickelback live\" /><h2>Setlist</h2><p>Classic hits plus new material.</p>",
  featuredImage: "/uploads/nb-poster.jpg",
  additionalImages: [],
  albums: [{ title: "Get Rollin'", year: "2024", cover: "/uploads/album.jpg", description: "", tracks: ["Get Rollin'", "High Time"] }],
  tourStartDate: "2026-03-10T00:00:00.000Z",
  tourEndDate: "2027-09-08T00:00:00.000Z",
  tourYear: 2027,
  tourCities: ["Toronto", "London"],
  publishedAt: "2026-01-15T09:00:00.000Z",
  updatedAt: "2026-02-01T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  scheduleSummary: {
    source: "widget",
    concertsRemaining: 24,
    totalConcerts: 30,
    nextConcert: { city: "Toronto", date: "2026-03-10T00:00:00.000Z", venue: "Scotiabank Arena" },
  },
};

const second = {
  ...nickelback,
  id: "luk_1",
  slug: "luke-combs-tour-dates-2026-2027-concert-schedule-tickets",
  title: "Luke Combs Announces 2026 Stadium Run",
  metaTitle: "",
  artistName: "Luke Combs",
  genre: "Country",
  metaDescription: "",
  content: "<h2>Stadium Dates</h2><p>Luke Combs heads to NFL stadiums all summer.</p>",
  featuredImage: "",
  tourName: "",
  scheduleSummary: { source: "none", concertsRemaining: 0, totalConcerts: 0, nextConcert: null },
};

const third = {
  ...nickelback,
  id: "kla_1",
  slug: "karol-g-tour-dates-2027-concert-schedule-tickets",
  title: "Karol G Announces 2027 Latin America Tour",
  metaTitle: "Karol G Tour Dates 2027",
  artistName: "Karol G",
  genre: "Latin",
  tourStartDate: "2027-02-01T00:00:00.000Z",
  tourEndDate: "2027-06-30T00:00:00.000Z",
  tourYear: 2027,
  scheduleSummary: {
    source: "tour",
    concertsRemaining: 12,
    totalConcerts: 12,
    nextConcert: { city: "Bogotá", date: "2027-02-14T00:00:00.000Z", venue: "Estadio El Campín" },
  },
};

const draft = {
  ...nickelback,
  id: "drf_1",
  slug: "unreleased-tour-dates-2026-concert-schedule-tickets",
  status: "DRAFT",
};

const settings = { websiteName: "Concert Discovery", tagline: "Discover Tours", defaultSeoTitle: "", description: "" };

let failures = 0;
function check(label, actual, expected) {
  const pass = expected instanceof RegExp ? expected.test(actual) : actual === expected;
  if (!pass) {
    failures += 1;
    console.error(`FAIL  ${label}\n      expected: ${expected}\n      actual:   ${actual}`);
  } else {
    console.log(`ok    ${label}`);
  }
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

function textResponse(text, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text),
    text: async () => text,
  };
}

function createRes() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    end(body) {
      this.body = body || "";
    },
  };
}

async function run() {
  const { handler, renderRoute, composeDocument } = await import("../api/seo.mjs");

  function render(args) {
    const data = renderRoute({ apiBase: API, fetchError: false, ...args });
    if (!data) return null;
    data.html = composeDocument(template, data.head, data.body);
    return data;
  }

  for (const [name, blog] of [
    ["nickelback", nickelback],
    ["luke-combs", second],
    ["karol-g", third],
  ]) {
    const route = `/tours/${blog.slug}`;
    const doc = render({ routePath: route, blog, settings, siteOrigin: SITE, origin: BACKEND });
    console.log(`\n--- ${name} (${route}) status=${doc.status} ---`);
    check(`${name} status 200`, doc.status, 200);
    check(`${name} robots index,follow`, /<meta name="robots" content="index, follow" \/>/.test(doc.html), true);
    check(`${name} no noindex`, /noindex/.test(doc.html), false);
    check(`${name} canonical`, new RegExp(`<link rel="canonical" href="${`${SITE}/tours/${blog.slug}`.replace(/-/g, "\\-")}" \\/>`).test(doc.html), true);
    check(`${name} title unique`, new RegExp(`<title>[^<]`).test(doc.html), true);
    check(`${name} title not generic`, /<title>.*Tour Dates.*<\/title>|<title>.*(Nickelback|Luke Combs|Karol G).*<\/title>/.test(doc.html), true);
    check(`${name} meta description`, /<meta name="description" content="[^\x22]{30,}" \/>/.test(doc.html), true);
    check(`${name} json-ld article`, /"@type"\s*:\s*"Article"/.test(doc.html), true);
    check(`${name} json-ld breadcrumb`, /"@type"\s*:\s*"BreadcrumbList"/.test(doc.html), true);
    check(`${name} prerendered h1`, new RegExp("<h1[^>]*>").test(doc.html), true);
    check(`${name} prerendered artist`, doc.html.includes(blog.artistName), true);
    check(`${name} uploads rewritten`, !/src=["']\/uploads\//.test(doc.html), true);
    check(`${name} charset early`, doc.html.indexOf("<meta", 0) < doc.html.indexOf("<title"), true);
    check(`${name} single robots meta`, (doc.html.match(/name="robots"/g) || []).length, 1);
    check(`${name} root filled once`, (doc.html.match(/id="root"/g) || []).length, 1);
    check(`${name} og tags`, /property="og:url" content=.{20,}/.test(doc.html), true);
    const expectsEvent = Boolean(blog.scheduleSummary && blog.scheduleSummary.nextConcert);
    check(`${name} MusicEvent ${expectsEvent ? "present" : "absent"}`, /"@type"\s*:\s*"MusicEvent"/.test(doc.html), expectsEvent);
  }

  console.log("\n--- draft slug ---");
  const draftDoc = render({ routePath: `/tours/${draft.slug}`, blog: draft, settings, siteOrigin: SITE, origin: BACKEND });
  check("draft status 404", draftDoc.status, 404);
  check("draft robots noindex", /<meta name="robots" content="noindex, follow" \/>/.test(draftDoc.html), true);
  check("draft X-Robots-Tag flag", draftDoc.noindexHeader === true, true);
  check("draft no Event schema", /MusicEvent/.test(draftDoc.html), false);

  console.log("\n--- unknown slug ---");
  const missingDoc = render({
    routePath: "/tours/no-such-slug-2026-concert-schedule-tickets",
    blog: null,
    settings,
    siteOrigin: SITE,
    origin: BACKEND,
  });
  check("missing status 404", missingDoc.status, 404);
  check("missing robots noindex", /content="noindex, follow"/.test(missingDoc.html), true);

  console.log("\n--- unknown route ---");
  const unknownRoute = render({ routePath: "/some/other/page", blog: undefined, settings, siteOrigin: SITE, origin: BACKEND });
  check("unknown route status 404", unknownRoute.status, 404);
  check("unknown route noindex", /content="noindex, follow"/.test(unknownRoute.html), true);

  console.log("\n--- /404 route ---");
  const notFoundRoute = render({ routePath: "/404", blog: undefined, settings, siteOrigin: SITE, origin: BACKEND });
  check("/404 status 404", notFoundRoute.status, 404);
  check("/404 noindex", /content="noindex, follow"/.test(notFoundRoute.html), true);

  console.log("\n--- transient backend failure ---");
  const fallbackDoc = render({
    routePath: `/tours/${nickelback.slug}`,
    blog: null,
    fetchError: true,
    settings: null,
    siteOrigin: SITE,
    origin: BACKEND,
  });
  check("fallback status 503", fallbackDoc.status, 503);
  check("fallback no-store", fallbackDoc.cacheControl, "no-store");
  check("fallback retry-after", fallbackDoc.retryAfter, "30");
  check("fallback robots noindex", /content="noindex, follow"/.test(fallbackDoc.html), true);
  check("fallback no prerendered tour body", fallbackDoc.body, "");

  console.log("\n--- static pages ---");
  for (const route of ["/", "/tours", "/contact", "/privacy", "/terms"]) {
    const page = render({ routePath: route, blog: undefined, settings, siteOrigin: SITE, origin: BACKEND });
    check(`${route} status 200`, page.status, 200);
    check(`${route} robots index,follow`, /<meta name="robots" content="index, follow" \/>/.test(page.html), true);
    check(`${route} canonical`, new RegExp(`<link rel="canonical" href="${SITE.replace(/\//g, "\\/")}${route === "/" ? "\\/" : route}" \\/>`).test(page.html), true);
    check(`${route} title`, /<title>[^\s]/.test(page.html), true);
  }

  console.log("\n--- filtered /tours ---");
  const filteredDoc = render({ routePath: "/tours", blog: undefined, settings, siteOrigin: SITE, origin: BACKEND, filtered: true });
  check("filtered status 200", filteredDoc.status, 200);
  check("filtered noindex", /content="noindex, follow"/.test(filteredDoc.html), true);
  check("filtered canonical /tours", /<link rel="canonical" href="https:\/\/concert-discovery\.vercel\.app\/tours" \/>/.test(filteredDoc.html), true);

  const originalFetch = global.fetch;

  console.log("\n--- handler: template outage (cold cache) ---");
  global.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith(`${API}/blogs/`)) return jsonResponse({ blog: nickelback });
    if (url.startsWith(`${API}/settings`)) return jsonResponse({ settings });
    throw new Error(`Template down: ${url}`);
  };
  try {
    const res = createRes();
    await handler({ url: `/api/seo?path=/tours/${nickelback.slug}`, headers: { host: "concert-discovery.vercel.app" } }, res);
    check("handler template outage 503", res.statusCode, 503);
    check("handler template outage retry-after", res.headers["retry-after"], "30");
  } finally {
    global.fetch = originalFetch;
  }

  console.log("\n--- handler: published tour ---");
  global.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith(`${API}/blogs/${nickelback.slug}`)) return jsonResponse({ blog: nickelback });
    if (url.startsWith(`${API}/settings`)) return jsonResponse({ settings });
    if (url.startsWith(`${SITE}/index.html`)) return textResponse(template);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    const req = { url: `/api/seo?path=/tours/${nickelback.slug}`, headers: { host: "concert-discovery.vercel.app", "x-forwarded-proto": "https" } };
    const res = createRes();
    await handler(req, res);
    check("handler 200", res.statusCode, 200);
    check("handler html content type", res.headers["content-type"], "text/html; charset=utf-8");
    check("handler no X-Robots-Tag", res.headers["x-robots-tag"], undefined);
    check("handler has canonical", res.body.includes(`<link rel="canonical" href="${SITE}/tours/${nickelback.slug}" />`), true);
    check("handler has MusicEvent", /"@type"\s*:\s*"MusicEvent"/.test(res.body), true);
    check("handler root filled", (res.body.match(/id="root"/g) || []).length, 1);
  } finally {
    global.fetch = originalFetch;
  }

  console.log("\n--- handler: draft (API returns DRAFT) ---");
  global.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith(`${API}/blogs/`)) return jsonResponse({ blog: draft });
    if (url.startsWith(`${API}/settings`)) return jsonResponse({ settings });
    if (url.startsWith(`${SITE}/index.html`)) return textResponse(template);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    const res = createRes();
    await handler({ url: `/api/seo?path=/tours/${draft.slug}`, headers: { host: "concert-discovery.vercel.app" } }, res);
    check("handler draft 404", res.statusCode, 404);
    check("handler draft X-Robots-Tag", res.headers["x-robots-tag"], "noindex, nofollow");
  } finally {
    global.fetch = originalFetch;
  }

  console.log("\n--- handler: API 404 ---");
  global.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith(`${API}/blogs/`)) return jsonResponse({ error: "Not found" }, 404);
    if (url.startsWith(`${API}/settings`)) return jsonResponse({ settings });
    if (url.startsWith(`${SITE}/index.html`)) return textResponse(template);
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    const res = createRes();
    await handler({ url: `/api/seo?path=/tours/does-not-exist-2026`, headers: { host: "concert-discovery.vercel.app" } }, res);
    check("handler missing 404", res.statusCode, 404);
    check("handler missing noindex header", res.headers["x-robots-tag"], "noindex, nofollow");
  } finally {
    global.fetch = originalFetch;
  }

  console.log("\n--- handler: backend outage ---");
  global.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith(`${SITE}/index.html`)) return textResponse(template);
    throw new Error(`Backend down: ${url}`);
  };
  try {
    const res = createRes();
    await handler({ url: `/api/seo?path=/tours/${nickelback.slug}`, headers: { host: "concert-discovery.vercel.app" } }, res);
    check("handler outage 503", res.statusCode, 503);
    check("handler outage retry-after", res.headers["retry-after"], "30");
    check("handler outage no-store", res.headers["cache-control"], "no-store");
    check("handler outage noindex", res.headers["x-robots-tag"], "noindex, follow");
    check("handler outage no tour body", res.body.includes("data-prerendered"), false);
  } finally {
    global.fetch = originalFetch;
  }

  console.log(`\n${failures === 0 ? "ALL TESTS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
