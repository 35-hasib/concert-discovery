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

const { renderRoute, composeDocument } = require("../api/seo.cjs");

const SITE = "https://concert-discovery.vercel.app";
const BACKEND = "https://concert-discovery.onrender.com";

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
  tourCities: ["Toronto", "London"],
  publishedAt: "2026-01-15T09:00:00.000Z",
  updatedAt: "2026-02-01T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  scheduleSummary: { source: "widget", concertsRemaining: 24 },
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
  scheduleSummary: { source: "none" },
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

function render(args) {
  const data = renderRoute({ apiBase: `${BACKEND}/api`, fetchError: false, ...args });
  if (!data) return null;
  data.html = composeDocument(template, data.head, data.body);
  return data;
}

const template = fs.readFileSync(templatePath, "utf8");

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
  check(`${name} no stray noindex`, /noindex/.test(doc.html.replace(/"noindexHeader"/g, "")), false);
  check(`${name} canonical`, new RegExp(`<link rel="canonical" href="${`${SITE}/tours/${blog.slug}`.replace(/-/g, "\\-")}" \\/>`).test(doc.html), true);
  check(`${name} title unique`, new RegExp(`<title>[^<]`).test(doc.html), true);
  check(`${name} title not generic`, /<title>.*Tour Dates.*<\/title>|<title>.*(Nickelback|Luke Combs|Karol G).*<\/title>/.test(doc.html), true);
  check(`${name} meta description`, /<meta name="description" content="[^\x22]{30,}\" \/>/.test(doc.html), true);
  check(`${name} json-ld article`, /"@type"\s*:\s*"Article"/.test(doc.html), true);
  check(`${name} json-ld breadcrumb`, /"@type"\s*:\s*"BreadcrumbList"/.test(doc.html), true);
  check(`${name} prerendered h1`, new RegExp("<h1[^>]*>").test(doc.html), true);
  check(`${name} prerendered artist`, doc.html.includes(blog.artistName), true);
  check(`${name} uploads rewritten`, !/src=["']\/uploads\//.test(doc.html), true);
  check(`${name} charset early`, doc.html.indexOf("<meta", 0) < doc.html.indexOf("<title"), true);
  check(`${name} single robots meta`, (doc.html.match(/name="robots"/g) || []).length, 1);
  check(`${name} root filled once`, (doc.html.match(/id="root"/g) || []).length, 1);
  check(`${name} og tags`, /property="og:url" content=.{20,}/.test(doc.html), true);
}

console.log("\n--- draft slug ---");
const draftDoc = render({
  routePath: `/tours/${draft.slug}`,
  blog: draft,
  settings,
  siteOrigin: SITE,
  origin: BACKEND,
});
check("draft status 404", draftDoc.status, 404);
check("draft robots noindex", /<meta name="robots" content="noindex, follow" \/>/.test(draftDoc.html), true);
check("draft X-Robots-Tag flag", draftDoc.noindexHeader === true, true);

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

console.log("\n--- transient backend failure ---");
const fallbackDoc = render({
  routePath: `/tours/${nickelback.slug}`,
  blog: null,
  fetchError: true,
  settings: null,
  siteOrigin: SITE,
  origin: BACKEND,
});
check("fallback status 200", fallbackDoc.status, 200);
check("fallback robots index,follow", /content="index, follow"/.test(fallbackDoc.html), true);
check("fallback no noindex", /noindex/.test(fallbackDoc.html.replace(/"noindexHeader"/g, "")), false);

console.log("\n--- static pages ---");
for (const route of ["/", "/tours", "/contact", "/privacy", "/terms"]) {
  const page = render({ routePath: route, blog: undefined, settings, siteOrigin: SITE, origin: BACKEND });
  check(`${route} status 200`, page.status, 200);
  check(`${route} robots index,follow`, /<meta name="robots" content="index, follow" \/>/.test(page.html), true);
  check(`${route} canonical`, new RegExp(`<link rel="canonical" href="${SITE.replace(/\//g, "\\/")}${route === "/" ? "\\/" : route}" \\/>`).test(page.html), true);
  check(`${route} title`, /<title>[^\s]/.test(page.html), true);
}

console.log(`\n${failures === 0 ? "ALL TESTS PASSED" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
